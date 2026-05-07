function createAuthController(authService) {
  return {
    async register(request, response, next) {
      try {
        const result = await authService.register(request.body);
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    async login(request, response, next) {
      try {
        const result = await authService.login(request.body);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async me(request, response, next) {
      try {
        const result = await authService.getCurrentUser(request.auth.userId);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createAuthController
};

