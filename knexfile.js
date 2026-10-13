require('dotenv').config();

function configuration() {
  return {
    client: 'pg',
    // Keep imports and secret-free builds valid. Resolve at pool acquisition so
    // missing credentials produce a clear error only when the database is used.
    connection: () => {
      let connectionString = process.env.DATABASE_URL?.trim();
      if (!connectionString) throw new Error('DATABASE_URL is required to connect to the database.');
      // A preview may also run next start with NODE_ENV=production. Only the
      // tracked deployment command enables the explicit TLS requirement.
      if (process.env.DATABASE_REQUIRE_TLS === '1') {
        let url;
        try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.'); }
        if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
        // pg URL SSL parameters override an ssl config object. Require verified
        // TLS in the URL itself, retaining configured certificates and identity.
        url.searchParams.delete('ssl');
        url.searchParams.set('sslmode', 'verify-full');
        connectionString = url.toString();
      }
      return { connectionString };
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
  };
}

module.exports = { development: configuration(), production: configuration(), test: configuration() };
