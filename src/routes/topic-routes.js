const express = require('express');

function createTopicRoutes(topicController, middleware, uploadImage) {
  const { requireAuth, optionalAuth } = middleware;
  const router = express.Router();

  // Public reads use optionalAuth so private/owned topics appear when logged in.
  router.get('/', optionalAuth, topicController.list);
  router.post('/', requireAuth, topicController.create);
  router.get('/:id', optionalAuth, topicController.getOne);
  router.put('/:id', requireAuth, topicController.update);
  router.delete('/:id', requireAuth, topicController.remove);

  router.get('/:id/messages', optionalAuth, topicController.listMessages);
  router.post('/:id/messages', requireAuth, uploadImage, topicController.postMessage);

  return router;
}

module.exports = {
  createTopicRoutes
};
