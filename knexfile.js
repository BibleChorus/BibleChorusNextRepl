require('dotenv').config();

function configuration() {
  return {
    client: 'pg',
    // Keep imports and secret-free builds valid. Resolve at pool acquisition so
    // missing credentials produce a clear error only when the database is used.
    connection: () => {
      const connectionString = process.env.DATABASE_URL?.trim();
      if (!connectionString) throw new Error('DATABASE_URL is required to connect to the database.');
      return { connectionString };
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
  };
}

module.exports = { development: configuration(), production: configuration(), test: configuration() };
