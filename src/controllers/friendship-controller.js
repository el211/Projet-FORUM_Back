function createFriendshipController(friendshipService) {
  return {
    async request(request, response, next) {
      try {
        const friendship = await friendshipService.sendRequest(
          request.auth.userId,
          request.body.username
        );
        response.status(201).json({ friendship });
      } catch (error) {
        next(error);
      }
    },

    async accept(request, response, next) {
      try {
        const friendship = await friendshipService.respond(request.params.id, request.auth.userId, true);
        response.json({ friendship });
      } catch (error) {
        next(error);
      }
    },

    async decline(request, response, next) {
      try {
        const friendship = await friendshipService.respond(request.params.id, request.auth.userId, false);
        response.json({ friendship });
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createFriendshipController
};
