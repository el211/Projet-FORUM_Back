const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { HttpError } = require('../errors/http-error');
const { sanitizeUser } = require('../utils/sanitize-user');
const { validateLoginPayload, validateRegistrationPayload } = require('../validators/auth-validator');

class AuthService {
  constructor(config, userRepository, mailService) {
    this.config = config;
    this.userRepository = userRepository;
    this.mailService = mailService;
  }

  normalizeIdentifier(value) {
    if (!this.config.app.auth.identifierCaseInsensitive) {
      return value.trim();
    }

    return value.trim().toLowerCase();
  }

  issueAccessToken(user) {
    const jwtConfig = this.config.app.security.jwt;

    return jwt.sign(
      {
        username: user.username,
        roles: user.roles
      },
      jwtConfig.secret,
      {
        subject: user.id,
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }
    );
  }

  async register(payload) {
    const validatedPayload = validateRegistrationPayload(payload, this.config.app.auth);
    const usernameNormalized = this.normalizeIdentifier(validatedPayload.username);
    const emailNormalized = this.normalizeIdentifier(validatedPayload.email);

    const existingUsername = await this.userRepository.findByUsernameNormalized(usernameNormalized);

    if (existingUsername) {
      throw new HttpError(409, 'Username is already used');
    }

    const existingEmail = await this.userRepository.findByEmailNormalized(emailNormalized);

    if (existingEmail) {
      throw new HttpError(409, 'Email is already used');
    }

    const user = {
      id: uuidv4(),
      username: validatedPayload.username,
      usernameNormalized,
      email: validatedPayload.email,
      emailNormalized,
      passwordHash: bcrypt.hashSync(validatedPayload.password, 10),
      roles: ['USER'],
      createdAt: new Date().toISOString()
    };

    await this.userRepository.create(user);
    await this.mailService.sendWelcomeEmail(user);

    const response = {
      user: sanitizeUser(user)
    };

    if (this.config.app.auth.issueTokenOnRegister) {
      response.token = this.issueAccessToken(user);
      response.tokenType = 'Bearer';
      response.expiresIn = this.config.app.security.jwt.expiresIn;
    }

    return response;
  }

  async login(payload) {
    const validatedPayload = validateLoginPayload(payload);
    const identifierNormalized = this.normalizeIdentifier(validatedPayload.identifier);
    const user = await this.userRepository.findByIdentifier(identifierNormalized);

    if (!user || !bcrypt.compareSync(validatedPayload.password, user.passwordHash)) {
      throw new HttpError(401, 'Invalid credentials');
    }

    return {
      token: this.issueAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: this.config.app.security.jwt.expiresIn,
      user: sanitizeUser(user)
    };
  }

  async getCurrentUser(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return {
      user: sanitizeUser(user)
    };
  }
}

module.exports = {
  AuthService
};

