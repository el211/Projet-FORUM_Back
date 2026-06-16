const { v4: uuidv4 } = require('uuid');

const { getPool } = require('../db/pool');

function mapMessage(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    topicId: row.topic_id,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      username: row.author_username,
      avatarUrl: row.author_avatar
    },
    likes: Number(row.likes || 0),
    dislikes: Number(row.dislikes || 0),
    score: Number(row.score || 0),
    // -1, 0 or 1 — the current viewer's own vote, when known.
    myVote: row.my_vote != null ? Number(row.my_vote) : 0
  };
}

// Sort modes for FT-8. Default is most recent first.
const SORTS = {
  recent: 'm.created_at DESC',
  oldest: 'm.created_at ASC',
  popularity: 'score DESC, m.created_at DESC'
};

const MESSAGE_SELECT = `
  SELECT m.id, m.topic_id, m.author_id, m.body, m.image_url, m.created_at,
         u.username AS author_username, u.avatar_url AS author_avatar,
         COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS likes,
         COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS dislikes,
         COALESCE(SUM(v.value), 0) AS score,
         MAX(CASE WHEN v.user_id = ? THEN v.value END) AS my_vote
    FROM messages m
    JOIN users u ON u.id = m.author_id
    LEFT JOIN message_votes v ON v.message_id = m.id`;

class MessageRepository {
  constructor() {
    this.pool = getPool();
  }

  async create({ topicId, authorId, body, imageUrl }) {
    const id = uuidv4();
    await this.pool.query(
      'INSERT INTO messages (id, topic_id, author_id, body, image_url) VALUES (?, ?, ?, ?, ?)',
      [id, topicId, authorId, body, imageUrl || null]
    );
    return this.findById(id);
  }

  async findById(id, viewerId = null) {
    const [rows] = await this.pool.query(
      `${MESSAGE_SELECT} WHERE m.id = ? GROUP BY m.id, u.username, u.avatar_url`,
      [viewerId, id]
    );
    return mapMessage(rows[0]);
  }

  async listByTopic({ topicId, sort, limit, offset, viewerId }) {
    const orderBy = SORTS[sort] || SORTS.recent;
    const safeLimit = Number.isInteger(limit) ? limit : null;
    const safeOffset = Number.isInteger(offset) && offset > 0 ? offset : 0;
    const limitClause = safeLimit === null ? '' : `LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [rows] = await this.pool.query(
      `${MESSAGE_SELECT}
        WHERE m.topic_id = ?
        GROUP BY m.id, u.username, u.avatar_url
        ORDER BY ${orderBy}
        ${limitClause}`,
      [viewerId, topicId]
    );

    const [[countRow]] = await this.pool.query(
      'SELECT COUNT(*) AS total FROM messages WHERE topic_id = ?',
      [topicId]
    );

    return { items: rows.map(mapMessage), total: Number(countRow.total) };
  }

  async delete(id) {
    await this.pool.query('DELETE FROM messages WHERE id = ?', [id]);
  }

  // Casts a like (+1) or dislike (-1). A user has at most one vote per message
  // (PK message_id+user_id), so liking and disliking are mutually exclusive.
  // Voting the same way again removes the vote (toggle off).
  async vote(messageId, userId, value) {
    const [existing] = await this.pool.query(
      'SELECT value FROM message_votes WHERE message_id = ? AND user_id = ? LIMIT 1',
      [messageId, userId]
    );

    if (existing.length > 0 && existing[0].value === value) {
      await this.pool.query('DELETE FROM message_votes WHERE message_id = ? AND user_id = ?', [
        messageId,
        userId
      ]);
    } else {
      await this.pool.query(
        `INSERT INTO message_votes (message_id, user_id, value) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [messageId, userId, value]
      );
    }

    return this.findById(messageId, userId);
  }
}

module.exports = {
  MessageRepository,
  mapMessage
};
