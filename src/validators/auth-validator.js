const { HttpError } = require('../errors/http-error');
const { isValidEmail } = require('../utils/validators');

function validatePassword(password, policy) {
  const errors = [];

  if (typeof password !== 'string' || !password.trim()) {
    errors.push('Password is required');
    return errors;
  }

  if (password.length < policy.minLength) {
    errors.push(`Password must contain at least ${policy.minLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
}

function validateRegistrationPayload(payload, authConfig) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const username = typeof payload.username === 'string' ? payload.username.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const usernameRegex = new RegExp(authConfig.usernamePattern);

  const errors = [];

  if (!username) {
    errors.push('Username is required');
  } else if (!usernameRegex.test(username)) {
    errors.push('Username must contain only letters and numbers');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Email format is invalid');
  }

  errors.push(...validatePassword(password, authConfig.passwordPolicy));

  if (errors.length > 0) {
    throw new HttpError(400, 'Validation failed', errors);
  }

  return {
    username,
    email,
    password
  };
}

function validateLoginPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const identifier = typeof payload.identifier === 'string' ? payload.identifier.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const errors = [];

  if (!identifier) {
    errors.push('Identifier is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    throw new HttpError(400, 'Validation failed', errors);
  }

  return {
    identifier,
    password
  };
}

module.exports = {
  validateLoginPayload,
  validateRegistrationPayload
};

