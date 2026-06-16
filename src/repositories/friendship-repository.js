const { v4: uuidv4 } = require('uuid');

const { getPool } = require('../db/pool');

class FriendshipRepository {
  constructor() {
    this.pool = getPool();
  }

  // Existing relationship between two users in either direction.
  async findBetween(userA, userB) {
    const [rows] = await this.pool.query(
      `SELECT * FROM friendships
        WHERE (requester_id = ? AND addressee_id = ?)
           OR (requester_id = ? AND addressee_id = ?)
        LIMIT 1`,
      [userA, userB, userB, userA]
    );
    return rows[0] || null;
  }

  async create(requesterId, addresseeId) {
    const id = uuidv4();
    await this.pool.query(
      'INSERT INTO friendships (id, requester_id, addressee_id, status) VALUES (?, ?, ?, ?)',
      [id, requesterId, addresseeId, 'pending']
    );
    return this.findById(id);
  }

  async findById(id) {
    const [rows] = await this.pool.query('SELECT * FROM friendships WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  async updateStatus(id, status) {
    await this.pool.query('UPDATE friendships SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  // Accepted friends of a user (ids only), used for private-topic visibility.
  async getFriendIds(userId) {
    const [rows] = await this.pool.query(
      `SELECT requester_id, addressee_id FROM friendships
        WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?)`,
      [userId, userId]
    );
    return rows.map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id));
  }

  // Pending requests addressed TO this user.
  async listIncoming(userId) {
    const [rows] = await this.pool.query(
      `SELECT f.id, f.created_at, u.id AS user_id, u.username, u.avatar_url
         FROM friendships f
         JOIN users u ON u.id = f.requester_id
        WHERE f.addressee_id = ? AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      user: { id: row.user_id, username: row.username, avatarUrl: row.avatar_url }
    }));
  }

  // Accepted friends as full mini-profiles.
  async listFriends(userId) {
    const [rows] = await this.pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.bio
         FROM friendships f
         JOIN users u
           ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
        WHERE f.status = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)
        ORDER BY u.username`,
      [userId, userId, userId]
    );
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      bio: row.bio
    }));
  }
}

module.exports = {
  FriendshipRepository
};
