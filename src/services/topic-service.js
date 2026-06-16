const { HttpError } = require('../errors/http-error');
const { validateTopicPayload } = require('../validators/topic-validator');
const { resolvePagination, buildPageMeta } = require('../utils/pagination');

class TopicService {
  constructor(config, topicRepository, friendshipRepository) {
    this.config = config;
    this.topicRepository = topicRepository;
    this.friendshipRepository = friendshipRepository;
  }

  isAdmin(viewer) {
    return Boolean(viewer && viewer.roles && viewer.roles.includes('ADMIN'));
  }

  // Whether a viewer is allowed to open a specific topic.
  async assertCanView(topic, viewer) {
    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    const viewerId = viewer ? viewer.userId : null;
    const isOwner = viewerId && topic.author.id === viewerId;

    if (this.isAdmin(viewer) || isOwner) {
      return;
    }

    if (topic.state === 'archived') {
      throw new HttpError(404, 'Topic not found');
    }

    if (topic.visibility === 'private') {
      const friendIds = viewerId ? await this.friendshipRepository.getFriendIds(viewerId) : [];
      if (!friendIds.includes(topic.author.id)) {
        throw new HttpError(403, 'This topic is private');
      }
    }
  }

  async createTopic(authorId, payload) {
    const data = validateTopicPayload(payload);
    return this.topicRepository.create(
      {
        title: data.title,
        body: data.body,
        authorId,
        state: data.state,
        visibility: data.visibility
      },
      data.tags
    );
  }

  async getTopic(id, viewer) {
    const topic = await this.topicRepository.findById(id);
    await this.assertCanView(topic, viewer);
    return topic;
  }

  async listTopics(query, viewer) {
    const pagination = resolvePagination(query, this.config.app.pagination);
    const viewerId = viewer ? viewer.userId : null;
    const isAdmin = this.isAdmin(viewer);
    const friendIds = viewerId ? await this.friendshipRepository.getFriendIds(viewerId) : [];

    const { items, total } = await this.topicRepository.list({
      tag: query.tag ? String(query.tag).toLowerCase().trim() : null,
      search: query.search ? String(query.search).trim() : null,
      limit: pagination.limit,
      offset: pagination.offset,
      viewerId,
      isAdmin,
      friendIds
    });

    return { topics: items, pagination: buildPageMeta(pagination, total) };
  }

  async assertOwner(topic, viewer) {
    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }
    if (!viewer || topic.author.id !== viewer.userId) {
      throw new HttpError(403, 'Only the topic owner can do this');
    }
  }

  async updateTopic(id, viewer, payload) {
    const topic = await this.topicRepository.findById(id);
    await this.assertOwner(topic, viewer);
    const data = validateTopicPayload(payload);
    return this.topicRepository.update(
      id,
      { title: data.title, body: data.body, state: data.state, visibility: data.visibility },
      data.tags
    );
  }

  async deleteTopic(id, viewer) {
    const topic = await this.topicRepository.findById(id);
    await this.assertOwner(topic, viewer);
    await this.topicRepository.delete(id);
  }
}

module.exports = {
  TopicService
};
