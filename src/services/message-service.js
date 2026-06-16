const { HttpError } = require('../errors/http-error');
const { resolvePagination, buildPageMeta } = require('../utils/pagination');

function validateMessageBody(body) {
  const value = typeof body === 'string' ? body.trim() : '';
  if (!value) {
    throw new HttpError(400, 'Validation failed', ['Message body is required']);
  }
  if (value.length > 5000) {
    throw new HttpError(400, 'Validation failed', ['Message body is too long (max 5000 chars)']);
  }
  return value;
}

class MessageService {
  constructor(config, messageRepository, topicRepository, topicService) {
    this.config = config;
    this.messageRepository = messageRepository;
    this.topicRepository = topicRepository;
    this.topicService = topicService;
  }

  async listMessages(topicId, query, viewer) {
    const topic = await this.topicRepository.findById(topicId);
    await this.topicService.assertCanView(topic, viewer);

    const pagination = resolvePagination(query, this.config.app.pagination);
    const sort = ['recent', 'oldest', 'popularity'].includes(query.sort) ? query.sort : 'recent';

    const { items, total } = await this.messageRepository.listByTopic({
      topicId,
      sort,
      limit: pagination.limit,
      offset: pagination.offset,
      viewerId: viewer ? viewer.userId : null
    });

    return { messages: items, sort, pagination: buildPageMeta(pagination, total) };
  }

  async postMessage(topicId, viewer, { body, imageUrl }) {
    const topic = await this.topicRepository.findById(topicId);
    await this.topicService.assertCanView(topic, viewer);

    // A closed or archived topic cannot receive new messages (FT-3 note).
    if (topic.state !== 'open') {
      throw new HttpError(409, `Cannot post in a ${topic.state} topic`);
    }

    const cleanBody = validateMessageBody(body);
    return this.messageRepository.create({
      topicId,
      authorId: viewer.userId,
      body: cleanBody,
      imageUrl: imageUrl || null
    });
  }

  // Removable by the message author, the topic owner, or an admin.
  async deleteMessage(messageId, viewer) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpError(404, 'Message not found');
    }

    const topic = await this.topicRepository.findById(message.topicId);
    const isAdmin = viewer.roles && viewer.roles.includes('ADMIN');
    const isMessageAuthor = message.author.id === viewer.userId;
    const isTopicOwner = topic && topic.author.id === viewer.userId;

    if (!isAdmin && !isMessageAuthor && !isTopicOwner) {
      throw new HttpError(403, 'You cannot delete this message');
    }

    await this.messageRepository.delete(messageId);
  }

  async voteMessage(messageId, viewer, value) {
    if (value !== 1 && value !== -1) {
      throw new HttpError(400, 'Vote must be 1 (like) or -1 (dislike)');
    }

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpError(404, 'Message not found');
    }

    const topic = await this.topicRepository.findById(message.topicId);
    await this.topicService.assertCanView(topic, viewer);

    return this.messageRepository.vote(messageId, viewer.userId, value);
  }
}

module.exports = {
  MessageService
};
