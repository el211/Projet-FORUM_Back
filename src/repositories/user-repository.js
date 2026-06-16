const { getPool } = require('../db/pool');

// Maps a raw DB row (snake_case) to the camelCase shape the app uses.
function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    usernameNormalized: row.username_normalized,
    email: row.email,
    emailNormalized: row.email_normalized,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    role: row.role,
    roles: [row.role],
    bio: row.bio,
    avatarUrl: row.avatar_url,
    banned: Boolean(row.banned),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at
  };
}

class UserRepository {
  constructor() {
    this.pool = getPool();
  }

  async findById(id) {
    const [rows] = await this.pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return mapUser(rows[0]);
  }

  async findByEmailNormalized(emailNormalized) {
    const [rows] = await this.pool.query(
      'SELECT * FROM users WHERE email_normalized = ? LIMIT 1',
      [emailNormalized]
    );
    return mapUser(rows[0]);
  }

  async findByUsernameNormalized(usernameNormalized) {
    const [rows] = await this.pool.query(
      'SELECT * FROM users WHERE username_normalized = ? LIMIT 1',
      [usernameNormalized]
    );
    return mapUser(rows[0]);
  }

  async findByIdentifier(identifierNormalized) {
    const [rows] = await this.pool.query(
      'SELECT * FROM users WHERE email_normalized = ? OR username_normalized = ? LIMIT 1',
      [identifierNormalized, identifierNormalized]
    );
    return mapUser(rows[0]);
  }

  async create(user) {
    await this.pool.query(
      `INSERT INTO users
        (id, username, username_normalized, email, email_normalized,
         password_hash, password_salt, role, bio, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.usernameNormalized,
        user.email,
        user.emailNormalized,
        user.passwordHash,
        user.passwordSalt,
        user.role || 'USER',
        user.bio || null,
        user.avatarUrl || null
      ]
    );
    return user;
  }

  async updateLastLogin(id) {
    await this.pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
  }

  async updateProfile(id, { bio, avatarUrl }) {
    await this.pool.query('UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?', [
      bio ?? null,
      avatarUrl ?? null,
      id
    ]);
    return this.findById(id);
  }

  async setBanned(id, banned) {
    await this.pool.query('UPDATE users SET banned = ? WHERE id = ?', [banned ? 1 : 0, id]);
  }

  // Profile stats: how many messages / topics this user has authored.
  async getStats(id) {
    const [[topicRow]] = await this.pool.query(
      'SELECT COUNT(*) AS count FROM topics WHERE author_id = ?',
      [id]
    );
    const [[messageRow]] = await this.pool.query(
      'SELECT COUNT(*) AS count FROM messages WHERE author_id = ?',
      [id]
    );
    return {
      topicCount: Number(topicRow.count),
      messageCount: Number(messageRow.count)
    };
  }

  async list() {
    const [rows] = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(mapUser);
  }
}

module.exports = {
  UserRepository,
  mapUser
};
