const { HttpError } = require('../errors/http-error');

// FTB-3: friend requests must be accepted or declined; accepted friends can
// see each other's private topics (enforced in topic visibility).
class FriendshipService {
  constructor(userRepository, friendshipRepository) {
    this.userRepository = userRepository;
    this.friendshipRepository = friendshipRepository;
  }

  async sendRequest(requesterId, targetUsername) {
    const target = await this.userRepository.findByUsernameNormalized(
      String(targetUsername || '').trim().toLowerCase()
    );
    if (!target) {
      throw new HttpError(404, 'User not found');
    }
    if (target.id === requesterId) {
      throw new HttpError(400, 'You cannot add yourself');
    }

    const existing = await this.friendshipRepository.findBetween(requesterId, target.id);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new HttpError(409, 'You are already friends');
      }
      if (existing.status === 'pending') {
        throw new HttpError(409, 'A request is already pending');
      }
      // A previously declined request can be re-opened.
      return this.friendshipRepository.updateStatus(existing.id, 'pending');
    }

    return this.friendshipRepository.create(requesterId, target.id);
  }

  async respond(friendshipId, userId, accept) {
    const friendship = await this.friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throw new HttpError(404, 'Friend request not found');
    }
    if (friendship.addressee_id !== userId) {
      throw new HttpError(403, 'Only the recipient can answer this request');
    }
    if (friendship.status !== 'pending') {
      throw new HttpError(409, 'This request has already been answered');
    }

    return this.friendshipRepository.updateStatus(friendshipId, accept ? 'accepted' : 'declined');
  }

  async listIncoming(userId) {
    return this.friendshipRepository.listIncoming(userId);
  }

  async listFriends(userId) {
    return this.friendshipRepository.listFriends(userId);
  }
}

module.exports = {
  FriendshipService
};
