const SSL_MODES = new Set(['disable', 'prefer', 'require', 'verify-ca', 'verify-full', 'no-verify']);
const SSL_URL_PARAMETERS = ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert'];

function isLocalDatabaseHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (['helium', 'localhost', '[::1]', '::1'].includes(host)) return true;
  if (['.helium', '.internal', '.localhost', '.local'].some(suffix => host.endsWith(suffix))) return true;
  return /^127(?:\.\d{1,3}){3}$/.test(host) && host.split('.').every(part => Number(part) <= 255);
}

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function explicitSsl(env) {
  if (present(env.PGSSL)) {
    const value = env.PGSSL.trim().toLowerCase();
    if (['true', '1', 'on'].includes(value)) return true;
    if (['false', '0', 'off'].includes(value)) return false;
    if (SSL_MODES.has(value)) return value === 'disable' ? false : value === 'no-verify' ? { rejectUnauthorized: false } : true;
    throw new Error('Invalid PGSSL setting. Use true, false, or a supported PostgreSQL SSL mode.');
  }
  if (present(env.PGSSLMODE)) {
    const mode = env.PGSSLMODE.trim().toLowerCase();
    if (!SSL_MODES.has(mode)) throw new Error('Invalid PGSSLMODE setting.');
    return mode === 'disable' ? false : mode === 'no-verify' ? { rejectUnauthorized: false } : true;
  }
  return undefined;
}

/** Resolve only when a connection is needed; never guess a local database. */
function getDatabaseConnection(env = process.env) {
  // A complete original PG configuration wins so adding a URL never silently
  // redirects an existing deployment to another database.
  if (['PGHOST', 'PGUSER', 'PGDATABASE'].every(key => present(env[key]))) {
    const port = present(env.PGPORT) ? Number(env.PGPORT) : 5432;
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PGPORT setting.');
    const ssl = explicitSsl(env);
    return {
      host: env.PGHOST,
      port,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
      // Retain the existing PG mode's TLS behavior unless explicitly configured.
      ssl: ssl === undefined ? { rejectUnauthorized: false } : ssl,
    };
  }

  // Replit keeps the pre-upgrade Neon URL for reference; DATABASE_URL is the
  // current Helium/production target and must win when both are present.
  const source = present(env.DATABASE_URL) ? 'DATABASE_URL' : present(env.NEON_DATABASE_URL) ? 'NEON_DATABASE_URL' : null;
  if (!source) throw new Error('Database configuration is missing or incomplete. Set PGHOST, PGUSER, and PGDATABASE, or NEON_DATABASE_URL/DATABASE_URL.');
  const connectionString = env[source].trim();
  let url;
  try { url = new URL(connectionString); } catch { throw new Error(`Invalid ${source} configuration.`); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !(url.username || url.searchParams.get('user')) || !url.pathname.slice(1)) {
    throw new Error(`Invalid ${source} configuration. Provide a PostgreSQL URL with a host, user, and database.`);
  }
  const mode = url.searchParams.get('sslmode');
  if (mode && !SSL_MODES.has(mode)) throw new Error(`Invalid ${source} SSL mode.`);

  // pg parses URL sslmode/certificate options itself. Supplying an additional
  // ssl object here would risk replacing those options or disabling validation.
  if (SSL_URL_PARAMETERS.some(parameter => present(url.searchParams.get(parameter)))) return { connectionString };
  const ssl = explicitSsl(env);
  return { connectionString, ssl: ssl === undefined ? isLocalDatabaseHost(url.hostname) ? false : { rejectUnauthorized: true } : ssl };
}

module.exports = { getDatabaseConnection };
