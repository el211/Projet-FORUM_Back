function createMessageController(messageService) {
  return {
    async remove(request, response, next) {
      try {
        await messageService.deleteMessage(request.params.id, request.auth);
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },

    async like(request, response, next) {
      try {
        const message = await messageService.voteMessage(request.params.id, request.auth, 1);
        response.json({ message });
      } catch (error) {
        next(error);
      }
    },

    async dislike(request, response, next) {
      try {
        const message = await messageService.voteMessage(request.params.id, request.auth, -1);
        response.json({ message });
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createMessageController
};
