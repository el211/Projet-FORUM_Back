const jwt = require('jsonwebtoken');

const { HttpError } = require('../errors/http-error');

function createAuthMiddleware(config, userRepository) {
  const jwtConfig = config.app.security.jwt;

  async function requireAuth(request, _response, next) {
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

      if (user.banned) {
        throw new HttpError(403, 'This account has been banned');
      }

      request.auth = {
        userId: user.id,
        username: user.username,
        roles: user.roles || []
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

  // Must run after requireAuth.
  function requireAdmin(request, _response, next) {
    if (!request.auth || !request.auth.roles.includes('ADMIN')) {
      next(new HttpError(403, 'Administrator role required'));
      return;
    }

    next();
  }

  // Optional auth: populates request.auth if a valid token is present,
  // but never rejects the request. Used for endpoints that show more to
  // logged-in users (e.g. private topics) but still serve guests.
  async function optionalAuth(request, _response, next) {
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      next();
      return;
    }

    try {
      const token = header.slice('Bearer '.length);
      const payload = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      });
      const user = await userRepository.findById(payload.sub);

      if (user && !user.banned) {
        request.auth = {
          userId: user.id,
          username: user.username,
          roles: user.roles || []
        };
      }
    } catch (_error) {
      // Ignore bad tokens for optional auth.
    }

    next();
  }

  return { requireAuth, requireAdmin, optionalAuth };
}

module.exports = {
  createAuthMiddleware
};
