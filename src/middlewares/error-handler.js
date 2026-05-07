const { HttpError } = require('../errors/http-error');

function notFoundHandler(request, _response, next) {
  next(new HttpError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

function errorHandler(logger) {
  return (error, _request, response, _next) => {
    const status = error instanceof HttpError ? error.status : 500;
    const payload = {
      message: error.message || 'Internal server error'
    };

    if (error.details) {
      payload.details = error.details;
    }

    if (status >= 500) {
      logger.error(error.stack || error.message);
    } else {
      logger.warn(error.message);
    }

    response.status(status).json(payload);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler
};

