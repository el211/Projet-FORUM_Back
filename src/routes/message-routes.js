const express = require('express');

function createMessageRoutes(messageController, middleware) {
  const { requireAuth } = middleware;
  const router = express.Router();

  router.delete('/:id', requireAuth, messageController.remove);
  router.post('/:id/like', requireAuth, messageController.like);
  router.post('/:id/dislike', requireAuth, messageController.dislike);

  return router;
}

module.exports = {
  createMessageRoutes
};
