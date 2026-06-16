const express = require('express');

function createAdminRoutes(adminController, middleware) {
  const { requireAuth, requireAdmin } = middleware;
  const router = express.Router();

  // Every admin route requires a valid token AND the ADMIN role.
  router.use(requireAuth, requireAdmin);

  router.get('/users', adminController.listUsers);
  router.post('/users/:id/ban', adminController.banUser);
  router.patch('/topics/:id/state', adminController.setTopicState);
  router.delete('/topics/:id', adminController.deleteTopic);
  router.delete('/messages/:id', adminController.deleteMessage);

  return router;
}

module.exports = {
  createAdminRoutes
};
