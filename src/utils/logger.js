function createLogger(loggingConfig = {}) {
  const currentLevel = loggingConfig.level || 'info';
  const priorities = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  function shouldLog(level) {
    return priorities[level] <= priorities[currentLevel];
  }

  function log(level, message) {
    if (!shouldLog(level)) {
      return;
    }

    console.log(`[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`);
  }

  return {
    error(message) {
      log('error', message);
    },
    warn(message) {
      log('warn', message);
    },
    info(message) {
      log('info', message);
    },
    debug(message) {
      log('debug', message);
    }
  };
}

module.exports = {
  createLogger
};

