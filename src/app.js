const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { HttpError } = require('./errors/http-error');
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');
const { requestLogger } = require('./middlewares/request-logger');
const { createAuthMiddleware } = require('./middlewares/auth-middleware');
const { UserRepository } = require('./repositories/user-repository');
const { AuthService } = require('./services/auth-service');
const { MailService } = require('./services/mail-service');
const { createAuthController } = require('./controllers/auth-controller');
const { createAuthRoutes } = require('./routes/auth-routes');

function createCorsOptions(config) {
  const corsConfig = config.app.cors || {};

  if (!corsConfig.enabled) {
    return null;
  }

  return {
    origin(origin, callback) {
      if (!origin || !Array.isArray(corsConfig.origins) || corsConfig.origins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new HttpError(403, 'Origin is not allowed by CORS policy'));
    },
    credentials: Boolean(corsConfig.credentials)
  };
}

function createApp(config, logger) {
  const app = express();
  const corsOptions = createCorsOptions(config);
  const userRepository = new UserRepository(config);
  const mailService = new MailService(config, logger);
  const authService = new AuthService(config, userRepository, mailService);
  const authMiddleware = createAuthMiddleware(config, userRepository);
  const authController = createAuthController(authService);

  app.use(helmet());
  app.use(express.json({ limit: config.server.jsonBodyLimit || '1mb' }));

  if (corsOptions) {
    app.use(cors(corsOptions));
  }

  if (config.logging && config.logging.logRequests) {
    app.use(requestLogger(logger));
  }

  app.get('/', (_request, response) => {
    response.json({
      name: config.app.name,
      profile: config.app.profile,
      apiPrefix: config.app.api.prefix,
      status: 'UP'
    });
  });

  app.get(`${config.app.api.prefix}/health`, (_request, response) => {
    response.json({
      status: 'UP',
      application: config.app.name,
      profile: config.app.profile,
      timestamp: new Date().toISOString()
    });
  });

  app.use(
    `${config.app.api.prefix}/auth`,
    createAuthRoutes(authController, authMiddleware.requireAuth)
  );

  app.use(notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}

module.exports = {
  createApp
};

