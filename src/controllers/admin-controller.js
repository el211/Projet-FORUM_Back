function createAdminController(adminService) {
  return {
    async listUsers(request, response, next) {
      try {
        const users = await adminService.listUsers();
        response.json({ users });
      } catch (error) {
        next(error);
      }
    },

    async banUser(request, response, next) {
      try {
        const banned = request.body.banned !== false; // default to banning
        const user = await adminService.setUserBanned(request.params.id, banned, request.auth.userId);
        response.json({ user });
      } catch (error) {
        next(error);
      }
    },

    async setTopicState(request, response, next) {
      try {
        const topic = await adminService.setTopicState(request.params.id, request.body.state);
        response.json({ topic });
      } catch (error) {
        next(error);
      }
    },

    async deleteTopic(request, response, next) {
      try {
        await adminService.deleteTopic(request.params.id);
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },

    async deleteMessage(request, response, next) {
      try {
        await adminService.deleteMessage(request.params.id);
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createAdminController
};
