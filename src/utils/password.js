const crypto = require('crypto');

// The spec requires passwords to be stored hashed with SHA-512.
// SHA-512 alone is fast and unsalted, which is weak, so we add a
// per-user random salt: hash = SHA512(salt + password).

function generateSalt() {
  return crypto.randomBytes(16).toString('hex'); // 32 hex chars
}

function hashPassword(password, salt) {
  return crypto
    .createHash('sha512')
    .update(salt + password, 'utf8')
    .digest('hex'); // 128 hex chars
}

function createPasswordHash(password) {
  const salt = generateSalt();
  return { salt, hash: hashPassword(password, salt) };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = hashPassword(password, salt);
  // Constant-time comparison to avoid timing leaks.
  const actualBuffer = Buffer.from(actual, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

module.exports = {
  generateSalt,
  hashPassword,
  createPasswordHash,
  verifyPassword
};
