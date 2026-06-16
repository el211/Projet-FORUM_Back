const mysql = require('mysql2/promise');

let pool = null;

// One shared connection pool for the whole app. Built lazily from config
// so tests / scripts can require modules without opening connections.
function createPool(config) {
  const db = config.app.database;

  pool = mysql.createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    waitForConnections: true,
    connectionLimit: db.connectionLimit || 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    dateStrings: true
  });

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialised. Call createPool(config) first.');
  }

  return pool;
}

module.exports = {
  createPool,
  getPool
};
