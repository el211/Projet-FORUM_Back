const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');
const { requestLogger } = require('./middlewares/request-logger');
const { createAuthMiddleware } = require('./middlewares/auth-middleware');
const { createUploadMiddleware } = require('./middlewares/upload-middleware');

const { UserRepository } = require('./repositories/user-repository');
const { TopicRepository } = require('./repositories/topic-repository');
const { MessageRepository } = require('./repositories/message-repository');
const { FriendshipRepository } = require('./repositories/friendship-repository');

const { AuthService } = require('./services/auth-service');
const { MailService } = require('./services/mail-service');
const { TopicService } = require('./services/topic-service');
const { MessageService } = require('./services/message-service');
const { AdminService } = require('./services/admin-service');
const { ProfileService } = require('./services/profile-service');
const { FriendshipService } = require('./services/friendship-service');

const { createAuthController } = require('./controllers/auth-controller');
const { createTopicController } = require('./controllers/topic-controller');
const { createMessageController } = require('./controllers/message-controller');
const { createAdminController } = require('./controllers/admin-controller');
const { createProfileController } = require('./controllers/profile-controller');
const { createFriendshipController } = require('./controllers/friendship-controller');

const { createAuthRoutes } = require('./routes/auth-routes');
const { createTopicRoutes } = require('./routes/topic-routes');
const { createMessageRoutes } = require('./routes/message-routes');
const { createAdminRoutes } = require('./routes/admin-routes');
const { createProfileRoutes } = require('./routes/profile-routes');

function createCorsOptions(config) {
  const corsConfig = config.app.cors || {};

  if (!corsConfig.enabled) {
    return null;
  }

  return {
    origin(origin, callback) {
      // No Origin header (same-origin / curl) or an allow-listed origin: allow.
      // An unknown cross-origin is simply not granted CORS headers (callback
      // false) rather than rejected — same-origin requests must still succeed.
      if (!origin || !Array.isArray(corsConfig.origins) || corsConfig.origins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: Boolean(corsConfig.credentials)
  };
}

function createApp(config, logger) {
  const app = express();
  const apiPrefix = config.app.api.prefix;
  const corsOptions = createCorsOptions(config);

  // Repositories (all backed by the shared MySQL pool).
  const userRepository = new UserRepository();
  const topicRepository = new TopicRepository();
  const messageRepository = new MessageRepository();
  const friendshipRepository = new FriendshipRepository();

  // Services.
  const mailService = new MailService(config, logger);
  const authService = new AuthService(config, userRepository, mailService);
  const topicService = new TopicService(config, topicRepository, friendshipRepository);
  const messageService = new MessageService(config, messageRepository, topicRepository, topicService);
  const adminService = new AdminService(userRepository, topicRepository, messageRepository);
  const profileService = new ProfileService(userRepository, friendshipRepository);
  const friendshipService = new FriendshipService(userRepository, friendshipRepository);

  // Middlewares + controllers.
  const middleware = createAuthMiddleware(config, userRepository);
  const uploadImage = createUploadMiddleware(config);
  const authController = createAuthController(authService);
  const topicController = createTopicController(topicService, messageService, topicRepository);
  const messageController = createMessageController(messageService);
  const adminController = createAdminController(adminService);
  const profileController = createProfileController(profileService, friendshipService);
  const friendshipController = createFriendshipController(friendshipService);

  // helmet with CSP relaxed enough for the static front-end + inline bootstrap.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(express.json({ limit: config.server.jsonBodyLimit || '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (corsOptions) {
    app.use(cors(corsOptions));
  }

  if (config.logging && config.logging.logRequests) {
    app.use(requestLogger(logger));
  }

  // Uploaded message images, served statically.
  app.use(
    config.app.uploads.publicPath || '/uploads',
    express.static(path.resolve(process.cwd(), config.app.uploads.dir))
  );

  // Health check.
  app.get(`${apiPrefix}/health`, (_request, response) => {
    response.json({
      status: 'UP',
      application: config.app.name,
      profile: config.app.profile,
      timestamp: new Date().toISOString()
    });
  });

  // API (data) routes.
  app.use(`${apiPrefix}/auth`, createAuthRoutes(authController, middleware.requireAuth));
  app.use(`${apiPrefix}/topics`, createTopicRoutes(topicController, middleware, uploadImage));
  app.get(`${apiPrefix}/tags`, topicController.listTags);
  app.use(`${apiPrefix}/messages`, createMessageRoutes(messageController, middleware));
  app.use(`${apiPrefix}/admin`, createAdminRoutes(adminController, middleware));
  app.use(`${apiPrefix}/profiles`, createProfileRoutes(profileController, friendshipController, middleware));

  // Static front-end (plain HTML/CSS/JS, no framework) served from src/front.
  const frontDir = path.join(__dirname, 'front');
  app.use(express.static(frontDir));
  app.get('/', (_request, response) => {
    response.sendFile(path.join(frontDir, 'index.html'));
  });

  // 404 + error handling last.
  app.use(`${apiPrefix}`, notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}

module.exports = {
  createApp
};
