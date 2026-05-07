function requestLogger(logger) {
  return (request, response, next) => {
    const startedAt = Date.now();

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      logger.info(
        `${request.method} ${request.originalUrl} -> ${response.statusCode} (${durationMs}ms)`
      );
    });

    next();
  };
}

module.exports = {
  requestLogger
};

