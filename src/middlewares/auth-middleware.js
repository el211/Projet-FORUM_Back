const jwt = require('jsonwebtoken');

const { HttpError } = require('../errors/http-error');

function createAuthMiddleware(config, userRepository) {
  const jwtConfig = config.app.security.jwt;

  return {
    async requireAuth(request, _response, next) {
      try {
        const header = request.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
          throw new HttpError(401, 'Missing or invalid Authorization header');
        }

        const token = header.slice('Bearer '.length);
        const payload = jwt.verify(token, jwtConfig.secret, {
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience
        });

        const user = await userRepository.findById(payload.sub);

        if (!user) {
          throw new HttpError(401, 'Authentication token is no longer valid');
        }

        request.auth = {
          userId: payload.sub,
          username: payload.username,
          roles: payload.roles || []
        };

        next();
      } catch (error) {
        if (error instanceof HttpError) {
          next(error);
          return;
        }

        next(new HttpError(401, 'Invalid or expired authentication token'));
      }
    }
  };
}

module.exports = {
  createAuthMiddleware
};

