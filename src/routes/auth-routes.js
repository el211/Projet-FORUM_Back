const express = require('express');

function createAuthRoutes(authController, requireAuth) {
  const router = express.Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.get('/me', requireAuth, authController.me);

  return router;
}

module.exports = {
  createAuthRoutes
};

