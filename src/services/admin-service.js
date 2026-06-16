const { HttpError } = require('../errors/http-error');
const { sanitizeUser } = require('../utils/sanitize-user');
const { validateState } = require('../validators/topic-validator');

// FT-11: actions reserved for the ADMIN role. Route-level requireAdmin already
// guards these; the service adds the data-level rules.
class AdminService {
  constructor(userRepository, topicRepository, messageRepository) {
    this.userRepository = userRepository;
    this.topicRepository = topicRepository;
    this.messageRepository = messageRepository;
  }

  async listUsers() {
    const users = await this.userRepository.list();
    return users.map(sanitizeUser);
  }

  async setUserBanned(targetUserId, banned, actingUserId) {
    if (targetUserId === actingUserId) {
      throw new HttpError(400, 'You cannot ban your own account');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    if (user.role === 'ADMIN') {
      throw new HttpError(403, 'Administrators cannot be banned');
    }

    await this.userRepository.setBanned(targetUserId, banned);
    return sanitizeUser(await this.userRepository.findById(targetUserId));
  }

  async setTopicState(topicId, rawState) {
    const state = validateState(rawState);
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }
    return this.topicRepository.updateState(topicId, state);
  }

  async deleteTopic(topicId) {
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }
    await this.topicRepository.delete(topicId);
  }

  async deleteMessage(messageId) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpError(404, 'Message not found');
    }
    await this.messageRepository.delete(messageId);
  }
}

module.exports = {
  AdminService
};
