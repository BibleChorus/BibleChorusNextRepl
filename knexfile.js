require('dotenv').config();
const { parse } = require('pg-connection-string');

function configuration() {
  return {
    client: 'pg',
    // Keep imports and secret-free builds valid. Resolve at pool acquisition so
    // missing credentials produce a clear error only when the database is used.
    connection: () => {
      let connectionString = process.env.DATABASE_URL?.trim();
      if (!connectionString) throw new Error('DATABASE_URL is required to connect to the database.');
      try {
        const url = new URL(connectionString);
        if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
        // A preview can also use NODE_ENV=production. Only deployment startup
        // requires verified TLS; retain the native parser's certificate handling.
        if (process.env.DATABASE_REQUIRE_TLS === '1') {
          url.searchParams.delete('ssl');
          url.searchParams.set('sslmode', 'verify-full');
          connectionString = url.toString();
        }
        const connection = parse(connectionString);
        if (![connection.host, connection.user, connection.database].every(value => typeof value === 'string' && value.trim())) throw new Error();
        const port = connection.port ? Number(connection.port) : 5432;
        if ((connection.port && !/^\d+$/.test(connection.port)) || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error();
        // A query parameter named connectionString would make pg parse a second
        // URL. Pass the resolved fields and prevent ambient PG* or pgpass fallback.
        delete connection.connectionString;
        const password = connection.password || '';
        return { ...connection, port, password: () => password, ssl: connection.ssl === undefined ? false : connection.ssl };
      } catch {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL with a host, user, and database.');
      }
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
  };
}

module.exports = { development: configuration(), production: configuration(), test: configuration() };
