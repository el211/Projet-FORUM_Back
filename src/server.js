const { createApp } = require('./app');
const { loadConfig } = require('./config/load-config');
const { createLogger } = require('./utils/logger');

async function bootstrap() {
  const config = loadConfig();
  const logger = createLogger(config.logging);
  const app = createApp(config, logger);

  app.listen(config.server.port, config.server.host, () => {
    logger.info(
      `${config.app.name} listening on http://${config.server.host}:${config.server.port}${config.app.api.prefix}`
    );
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

