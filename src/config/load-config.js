const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { deepMerge } = require('../utils/deep-merge');

function readYamlFile(filePath, required = false) {
  if (!fs.existsSync(filePath)) {
    if (required) {
      throw new Error(`Missing required configuration file: ${filePath}`);
    }

    return {};
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContents) || {};
}

function setNestedValue(target, pathSegments, value) {
  let cursor = target;

  for (let index = 0; index < pathSegments.length - 1; index += 1) {
    const segment = pathSegments[index];
    cursor[segment] = cursor[segment] || {};
    cursor = cursor[segment];
  }

  cursor[pathSegments[pathSegments.length - 1]] = value;
}

function parseEnvValue(rawValue) {
  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  if (/^\d+$/.test(rawValue)) {
    return Number(rawValue);
  }

  if (rawValue.includes(',')) {
    return rawValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return rawValue;
}

function buildEnvOverrides(env) {
  const overrides = {};

  if (env.PORT) {
    setNestedValue(overrides, ['server', 'port'], Number(env.PORT));
  }

  if (env.HOST) {
    setNestedValue(overrides, ['server', 'host'], env.HOST);
  }

  Object.entries(env)
    .filter(([key]) => key.startsWith('APP_CFG_'))
    .forEach(([key, value]) => {
      const pathSegments = key
        .replace('APP_CFG_', '')
        .split('__')
        .map((segment) => segment.toLowerCase());

      setNestedValue(overrides, pathSegments, parseEnvValue(value));
    });

  return overrides;
}

function determineProfile(baseConfig, env) {
  return (
    env.APP_PROFILE ||
    env.SPRING_PROFILES_ACTIVE ||
    baseConfig.app?.profile ||
    env.NODE_ENV ||
    'dev'
  );
}

function validateConfig(config) {
  if (!config.app?.security?.jwt?.secret) {
    throw new Error('Missing app.security.jwt.secret in configuration');
  }

  if (!config.app?.api?.prefix) {
    throw new Error('Missing app.api.prefix in configuration');
  }

  if (!config.app?.database?.database) {
    throw new Error('Missing app.database configuration (MySQL is required)');
  }

  if (config.app.profile === 'prod' && config.app.security.jwt.secret === 'change-me-in-production') {
    throw new Error('Refusing to start in prod with the default JWT secret');
  }
}

function loadConfig() {
  const projectRoot = process.cwd();
  const configDir = path.join(projectRoot, 'config');
  const baseConfigPath = path.join(configDir, 'application.yml');
  const baseConfig = readYamlFile(baseConfigPath, true);
  const profile = determineProfile(baseConfig, process.env);
  const profileConfigPath = path.join(configDir, `application-${profile}.yml`);
  const profileConfig = readYamlFile(profileConfigPath, false);
  const envOverrides = buildEnvOverrides(process.env);

  const mergedConfig = deepMerge(baseConfig, profileConfig, envOverrides);
  mergedConfig.app = mergedConfig.app || {};
  mergedConfig.app.profile = profile;

  validateConfig(mergedConfig);

  return mergedConfig;
}

module.exports = {
  loadConfig
};

