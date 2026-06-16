const { HttpError } = require('../errors/http-error');
const { sanitizeUser, sanitizePublicUser } = require('../utils/sanitize-user');

// FTB-2: every user has a profile (username, avatar, bio, last login,
// message count, topic count) viewable by others and editable by its owner.
class ProfileService {
  constructor(userRepository, friendshipRepository) {
    this.userRepository = userRepository;
    this.friendshipRepository = friendshipRepository;
  }

  async getMyProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    const stats = await this.userRepository.getStats(userId);
    return { ...sanitizeUser(user), ...stats };
  }

  async getPublicProfile(username, viewer) {
    const user = await this.userRepository.findByUsernameNormalized(
      String(username).trim().toLowerCase()
    );
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const stats = await this.userRepository.getStats(user.id);
    const profile = { ...sanitizePublicUser(user), ...stats };

    // Friendship status between the viewer and this profile, for the UI button.
    if (viewer && viewer.userId !== user.id) {
      const relation = await this.friendshipRepository.findBetween(viewer.userId, user.id);
      profile.friendship = relation
        ? { status: relation.status, requesterId: relation.requester_id, id: relation.id }
        : null;
    }

    return profile;
  }

  async updateProfile(userId, payload) {
    const bio = payload.bio != null ? String(payload.bio).trim().slice(0, 500) : null;
    const avatarUrl = payload.avatarUrl != null ? String(payload.avatarUrl).trim().slice(0, 255) : null;
    const updated = await this.userRepository.updateProfile(userId, { bio, avatarUrl });
    const stats = await this.userRepository.getStats(userId);
    return { ...sanitizeUser(updated), ...stats };
  }
}

module.exports = {
  ProfileService
};
