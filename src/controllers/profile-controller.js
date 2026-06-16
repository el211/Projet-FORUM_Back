function createProfileController(profileService, friendshipService) {
  return {
    async me(request, response, next) {
      try {
        const profile = await profileService.getMyProfile(request.auth.userId);
        response.json({ profile });
      } catch (error) {
        next(error);
      }
    },

    async updateMe(request, response, next) {
      try {
        const profile = await profileService.updateProfile(request.auth.userId, request.body);
        response.json({ profile });
      } catch (error) {
        next(error);
      }
    },

    async byUsername(request, response, next) {
      try {
        const profile = await profileService.getPublicProfile(request.params.username, request.auth);
        response.json({ profile });
      } catch (error) {
        next(error);
      }
    },

    async myFriends(request, response, next) {
      try {
        const friends = await friendshipService.listFriends(request.auth.userId);
        response.json({ friends });
      } catch (error) {
        next(error);
      }
    },

    async incomingRequests(request, response, next) {
      try {
        const requests = await friendshipService.listIncoming(request.auth.userId);
        response.json({ requests });
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createProfileController
};
