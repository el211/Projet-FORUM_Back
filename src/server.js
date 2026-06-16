const { createApp } = require('./app');
const { loadConfig } = require('./config/load-config');
const { createLogger } = require('./utils/logger');
const { createPool } = require('./db/pool');

async function bootstrap() {
  const config = loadConfig();
  const logger = createLogger(config.logging);

  // Open the MySQL pool first; everything else depends on it.
  const pool = createPool(config);
  await pool.query('SELECT 1');
  logger.info(`Connected to MySQL database "${config.app.database.database}"`);

  const app = createApp(config, logger);

  const server = app.listen(config.server.port, config.server.host, () => {
    logger.info(
      `${config.app.name} listening on http://${config.server.host}:${config.server.port} (API at ${config.app.api.prefix})`
    );
  });

  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
