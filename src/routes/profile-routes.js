const express = require('express');

function createProfileRoutes(profileController, friendshipController, middleware) {
  const { requireAuth, optionalAuth } = middleware;
  const router = express.Router();

  // Current user's own profile + friend management.
  router.get('/me', requireAuth, profileController.me);
  router.put('/me', requireAuth, profileController.updateMe);
  router.get('/me/friends', requireAuth, profileController.myFriends);
  router.get('/me/friend-requests', requireAuth, profileController.incomingRequests);

  router.post('/friend-requests', requireAuth, friendshipController.request);
  router.post('/friend-requests/:id/accept', requireAuth, friendshipController.accept);
  router.post('/friend-requests/:id/decline', requireAuth, friendshipController.decline);

  // Public profile lookup (optionalAuth so we can show the friendship status).
  router.get('/:username', optionalAuth, profileController.byUsername);

  return router;
}

module.exports = {
  createProfileRoutes
};
