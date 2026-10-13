require('dotenv').config();
const { getDatabaseConnection } = require('./lib/database-config');

function configuration() {
  return {
    client: 'pg',
    // Keep imports and secret-free builds valid. Resolve at pool acquisition so
    // missing credentials produce a clear error only when the database is used.
    connection: () => getDatabaseConnection(process.env),
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
  };
}

module.exports = { development: configuration(), production: configuration(), test: configuration() };
