// Convenience script: runs db/schema.sql then db/seed.sql against MySQL.
// Usage: npm run db:setup
// Reads DB credentials from config (application.yml + profile + env overrides).

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const { loadConfig } = require('../src/config/load-config');

async function runSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await connection.query(sql);
}

async function main() {
  const config = loadConfig();
  const db = config.app.database;

  // multipleStatements lets us run a whole .sql file in one call.
  const connection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    multipleStatements: true
  });

  try {
    const dbDir = path.join(process.cwd(), 'db');
    console.log('Applying schema.sql ...');
    await runSqlFile(connection, path.join(dbDir, 'schema.sql'));
    console.log('Applying seed.sql ...');
    await runSqlFile(connection, path.join(dbDir, 'seed.sql'));
    console.log('Database ready.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Database setup failed:', error.message);
  process.exit(1);
});
