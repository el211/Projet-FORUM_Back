// Container entrypoint: wait for MySQL, initialise the database on first run
// (schema + seed only if empty so restarts keep data), then start the server.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const { loadConfig } = require('../src/config/load-config');

async function connectWithRetry(db, attempts = 30) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await mysql.createConnection({
        host: db.host,
        port: db.port,
        user: db.user,
        password: db.password,
        multipleStatements: true
      });
    } catch (error) {
      console.log(`Waiting for MySQL (${i}/${attempts})... ${error.code || error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Could not connect to MySQL');
}

async function init() {
  const config = loadConfig();
  const db = config.app.database;
  const connection = await connectWithRetry(db);

  try {
    let needsSeed = false;
    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS count FROM \`${db.database}\`.users`
      );
      needsSeed = rows[0].count === 0;
    } catch (_error) {
      needsSeed = true; // database or table does not exist yet
    }

    if (needsSeed) {
      console.log('Initialising database (schema + seed)...');
      const dir = path.join(__dirname, '..', 'db');
      await connection.query(fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8'));
      await connection.query(fs.readFileSync(path.join(dir, 'seed.sql'), 'utf8'));
      console.log('Database initialised.');
    } else {
      console.log('Database already initialised, skipping seed.');
    }
  } finally {
    await connection.end();
  }
}

init()
  .then(() => {
    require('../src/server.js');
  })
  .catch((error) => {
    console.error('Startup failed:', error.message);
    process.exit(1);
  });
