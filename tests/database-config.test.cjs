const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const connectionStringParser = require('pg-connection-string');
const ts = require('typescript');

// Execute the real Knex configuration with an isolated environment; no pool is
// connected and no credentials from the developer's environment are inspected.
function configuration(env) {
  const result = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../knexfile.js'), 'utf8'), {
    module: result, process: { env }, URL,
    require(name) {
      if (name === 'dotenv') return { config() {} };
      assert.equal(name, 'pg-connection-string'); return connectionStringParser;
    },
  });
  return result.exports;
}

const current = 'postgresql://current_owner:offline-current@current.example.test/current_database?sslmode=verify-full';

test('the current DATABASE_URL is resolved with the native parser, and URL resolution remains lazy', () => {
  const env = {}; const config = configuration(env);
  env.DATABASE_URL = current;
  for (const environment of ['development', 'production', 'test']) {
    const connection = config[environment].connection();
    assert.equal(Object.hasOwn(connection, 'connectionString'), false);
    const client = new Client(connection); // Inspect native parsing; never connect.
    assert.equal(client.connectionParameters.host, 'current.example.test');
    assert.equal(client.connectionParameters.database, 'current_database');
    assert.equal(client.connectionParameters.user, 'current_owner');
    assert.equal(client.connectionParameters.port, 5432);
    assert.equal(connection.password(), 'offline-current');
    assert.ok(client.connectionParameters.ssl);
    assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false);
  }
});

test('saved Neon and individual PG variables never select a fallback database', () => {
  const old = { NEON_DATABASE_URL: 'postgresql://old:DO_NOT_LOG_ME@old.neon.tech/old_database', PGHOST: 'old-host', PGUSER: 'old-owner', PGDATABASE: 'old-database', PGPASSWORD: 'DO_NOT_LOG_ME' };
  const config = configuration(old);
  assert.throws(() => config.production.connection(), error => error.message === 'DATABASE_URL is required to connect to the database.');
  old.DATABASE_URL = current;
  assert.equal(new Client(config.production.connection()).connectionParameters.host, 'current.example.test');
});

test('native URL TLS modes control local and external connections without app overrides', () => {
  for (const [url, secure] of [
    ['postgresql://owner:offline@helium/app?sslmode=disable', false],
    ['postgresql://owner:offline@helium/app?sslmode=verify-full', true],
    ['postgresql://owner:offline@external.example.test/app?sslmode=disable', false],
    [current, true],
  ]) {
    const connection = configuration({ DATABASE_URL: url, NODE_ENV: 'production' }).production.connection();
    const ssl = new Client(connection).connectionParameters.ssl;
    if (secure) { assert.ok(ssl); assert.notEqual(ssl.rejectUnauthorized, false); }
    else assert.equal(ssl, false);
  }
});

test('published Replit processes require verified TLS when the current URL omits or disables it', () => {
  for (const query of ['', '?ssl=false', '?ssl=0', '?sslmode=disable', '?sslmode=no-verify', '?sslmode=disable&sslmode=disable', '?sslmode=require&uselibpqcompat=true']) {
    const connection = configuration({ DATABASE_URL: `postgresql://owner:offline@production.example.test/app${query}`, DATABASE_REQUIRE_TLS: '1' }).production.connection();
    assert.equal(connection.sslmode, 'verify-full');
    assert.equal(Object.hasOwn(connection, 'connectionString'), false);
    const client = new Client(connection); // Inspect configuration only, never connect.
    assert.ok(client.connectionParameters.ssl);
    assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false);
    assert.equal(client.connectionParameters.host, 'production.example.test');
    assert.equal(client.connectionParameters.database, 'app');
  }
});

test('published TLS retains stronger mode, certificate files, credentials, and non-TLS URL settings', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'biblechorus-tls-test-'));
  try {
    const files = { sslrootcert: ['root.crt', 'offline-root-certificate'], sslcert: ['client.crt', 'offline-client-certificate'], sslkey: ['client.key', 'offline-client-key'] };
    const url = new URL('postgresql://owner:p%40ss%2Fword@production.example.test:5434/app?sslmode=verify-full&application_name=BibleChorus&channel_binding=require');
    for (const [parameter, [name, content]] of Object.entries(files)) {
      const filename = path.join(directory, name); fs.writeFileSync(filename, content); url.searchParams.set(parameter, filename);
    }
    const connection = configuration({ DATABASE_URL: url.toString(), DATABASE_REQUIRE_TLS: '1' }).production.connection();
    assert.equal(connection.user, 'owner');
    assert.equal(connection.application_name, 'BibleChorus');
    assert.equal(connection.channel_binding, 'require');
    const client = new Client(connection);
    assert.equal(client.connectionParameters.ssl.ca, 'offline-root-certificate');
    assert.equal(client.connectionParameters.ssl.cert, 'offline-client-certificate');
    assert.equal(client.connectionParameters.ssl.key, 'offline-client-key');
    assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false);
    assert.equal(client.connectionParameters.port, 5434);
    await new Promise(resolve => client._getPassword(resolve)); // Resolve auth only; no socket is opened.
    assert.equal(client.connectionParameters.password, 'p@ss/word');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('NODE_ENV=production previews keep local Helium non-SSL settings and malformed deployment URLs fail without secrets', () => {
  for (const marker of [undefined, '0']) {
    const url = 'postgresql://owner:offline@helium/app?sslmode=disable';
    const connection = configuration({ DATABASE_URL: url, NODE_ENV: 'production', DATABASE_REQUIRE_TLS: marker }).production.connection();
    assert.equal(new Client(connection).connectionParameters.host, 'helium');
    assert.equal(new Client(connection).connectionParameters.ssl, false);
  }
  const implicit = configuration({ DATABASE_URL: 'postgresql://owner:offline@helium/app', NODE_ENV: 'production' }).production.connection();
  assert.equal(new Client(implicit).connectionParameters.ssl, false);
  for (const url of ['postgresql://owner:DO_NOT_LOG_ME@', 'https://owner:DO_NOT_LOG_ME@example.test/app']) {
    assert.throws(() => configuration({ DATABASE_URL: url, DATABASE_REQUIRE_TLS: '1' }).production.connection(), error => error.message === 'DATABASE_URL must be a valid PostgreSQL connection URL with a host, user, and database.');
  }
});

test('native pg cannot inherit ambient target, port, password, password-file, or TLS settings', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'biblechorus-pgpass-test-'));
  const filename = path.join(directory, 'pgpass');
  fs.writeFileSync(filename, '*:*:*:*:ambient-file-password\n', { mode: 0o600 });
  const hostile = { PGHOST: 'ambient.example.test', PGUSER: 'ambient_owner', PGDATABASE: 'ambient_database', PGPORT: '6432', PGPASSWORD: 'ambient-password', PGPASSFILE: filename, PGSSLMODE: 'no-verify' };
  const original = Object.fromEntries(Object.keys(hostile).map(key => [key, process.env[key]]));
  try {
    Object.assign(process.env, hostile);
    for (const [url, password, host, secure] of [
      [current, 'offline-current', 'current.example.test', true],
      ['postgresql://owner@helium/app', '', 'helium', false],
    ]) {
      const connection = configuration({ DATABASE_URL: url }).production.connection();
      const client = new Client(connection);
      assert.equal(client.connectionParameters.host, host);
      assert.equal(client.connectionParameters.user, host === 'helium' ? 'owner' : 'current_owner');
      assert.equal(client.connectionParameters.database, host === 'helium' ? 'app' : 'current_database');
      assert.equal(client.connectionParameters.port, 5432);
      if (secure) { assert.ok(client.connectionParameters.ssl); assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false); }
      else assert.equal(client.connectionParameters.ssl, false);
      await new Promise(resolve => client._getPassword(resolve)); // No connection or pgpass lookup.
      assert.equal(client.password, password);
      assert.equal(client.connectionParameters.password, password);
    }
  } finally {
    for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('effective native URL targets require a host, user, and database path even with PG variables or query defaults', () => {
  const legacy = { PGHOST: 'ambient.example.test', PGUSER: 'ambient_owner', PGDATABASE: 'ambient_database' };
  for (const url of [
    'postgresql:///app?user=owner&password=DO_NOT_LOG_ME',
    'postgresql://helium/app?password=DO_NOT_LOG_ME',
    'postgresql://owner:DO_NOT_LOG_ME@helium',
    'postgresql://owner:DO_NOT_LOG_ME@helium?database=query_database&dbname=query_database',
    'postgresql://owner:DO_NOT_LOG_ME@helium/%20',
  ]) {
    assert.throws(() => configuration({ ...legacy, DATABASE_URL: url }).production.connection(), error => error.message === 'DATABASE_URL must be a valid PostgreSQL connection URL with a host, user, and database.');
  }
  const query = configuration({ DATABASE_URL: 'postgresql:///app?host=query.example.test&user=query_owner&password=query-password&port=5433' }).production.connection();
  const client = new Client(query);
  assert.equal(client.connectionParameters.host, 'query.example.test');
  assert.equal(client.connectionParameters.user, 'query_owner');
  assert.equal(client.connectionParameters.database, 'app');
  assert.equal(client.connectionParameters.port, 5433);
  assert.equal(query.password(), 'query-password');
});

test('native last-query-value semantics are retained but a nested connectionString cannot retarget pg', () => {
  const nested = encodeURIComponent('postgresql://inner:inner-password@inner.example.test/inner_database?sslmode=disable');
  for (const marker of [undefined, '1']) {
    const connection = configuration({ DATABASE_URL: `postgresql://uri_owner:uri-password@authority.example.test:5434/uri_database?host=first.example.test&host=last.example.test&user=first_owner&user=last_owner&password=first-password&password=last-password&port=5435&port=5436&connectionString=${nested}`, DATABASE_REQUIRE_TLS: marker }).production.connection();
    const client = new Client(connection);
    assert.equal(Object.hasOwn(connection, 'connectionString'), false);
    assert.equal(client.connectionParameters.host, 'last.example.test');
    assert.equal(client.connectionParameters.user, 'last_owner');
    assert.equal(client.connectionParameters.database, 'uri_database');
    assert.equal(client.connectionParameters.port, 5436);
    assert.equal(connection.password(), 'last-password');
    if (marker) { assert.ok(client.connectionParameters.ssl); assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false); }
  }
  const fallback = configuration({ DATABASE_URL: 'postgresql://uri_owner:uri-password@authority.example.test:5434/uri_database?host=query.example.test&host=&user=query_owner&user=&password=query-password&password=&port=5435&port=' }).production.connection();
  const client = new Client(fallback);
  assert.equal(client.connectionParameters.host, 'authority.example.test');
  assert.equal(client.connectionParameters.user, 'uri_owner');
  assert.equal(client.connectionParameters.port, 5434);
  assert.equal(fallback.password(), 'uri-password');
});

test('invalid effective ports fail without accepting a numeric prefix or exposing credentials', () => {
  for (const port of ['0', '65536', '5432junk', '5432.5', '-1', 'Infinity']) {
    const url = `postgresql://owner:DO_NOT_LOG_ME@helium/app?port=${port}`;
    assert.throws(() => configuration({ DATABASE_URL: url }).production.connection(), error => error.message === 'DATABASE_URL must be a valid PostgreSQL connection URL with a host, user, and database.');
  }
});

test('the tracked deployment command enables TLS without changing preview startup', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../.replit'), 'utf8');
  const deployment = source.split('[deployment]')[1].split(/\n\[/)[0];
  const run = deployment.match(/^run\s*=\s*(\[[^\n]+\])$/m);
  assert.ok(run, 'A tracked deployment run command must exist');
  assert.deepEqual(JSON.parse(run[1]), ['env', 'DATABASE_REQUIRE_TLS=1', 'DATABASE_NAME=neondb', 'npm', 'run', 'start']);
  assert.match(source, /^run = "npm run dev"/);
  assert.equal(source.match(/DATABASE_REQUIRE_TLS/g)?.length, 1, 'TLS must be scoped to deployment startup');
  assert.equal(source.match(/DATABASE_NAME/g)?.length, 1, 'The database name must be scoped to deployment startup');
});

test('a managed URL without a database name uses DATABASE_NAME; a database in the URL always wins', () => {
  for (const url of ['postgresql://owner:offline@production.example.test/', 'postgresql://owner:offline@production.example.test', 'postgresql://owner:offline@production.example.test/?sslmode=require']) {
    const connection = configuration({ DATABASE_URL: url, DATABASE_REQUIRE_TLS: '1', DATABASE_NAME: 'neondb' }).production.connection();
    const client = new Client(connection); // Inspect configuration only, never connect.
    assert.equal(client.connectionParameters.database, 'neondb');
    assert.equal(client.connectionParameters.host, 'production.example.test');
    assert.equal(client.connectionParameters.user, 'owner');
    assert.ok(client.connectionParameters.ssl);
    assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false);
  }
  const explicit = configuration({ DATABASE_URL: 'postgresql://owner:offline@production.example.test/app', DATABASE_NAME: 'neondb' }).production.connection();
  assert.equal(new Client(explicit).connectionParameters.database, 'app');
  for (const name of [undefined, '', ' ']) {
    assert.throws(() => configuration({ DATABASE_URL: 'postgresql://owner:DO_NOT_LOG_ME@production.example.test/', DATABASE_NAME: name, PGDATABASE: 'ambient_database' }).production.connection(), error => error.message === 'DATABASE_URL must be a valid PostgreSQL connection URL with a host, user, and database.');
  }
});

test('fresh production imports and Knex initialization work without credentials; missing runtime URL is clear', () => {
  const root = path.resolve(__dirname, '..');
  const script = `
    const assert = require('node:assert/strict');
    const config = require(${JSON.stringify(path.join(root, 'knexfile.js'))});
    const db = require(${JSON.stringify(path.join(root, 'db.js'))});
    assert.equal(typeof config.production.connection, 'function');
    assert.throws(() => config.production.connection(), error => error.message === 'DATABASE_URL is required to connect to the database.');
    db.destroy().then(() => process.stdout.write('lazy configuration verified'));
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: os.tmpdir(), env: { NODE_ENV: 'production', DATABASE_REQUIRE_TLS: '1', PATH: process.env.PATH || '' }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /lazy configuration verified/);
});

test('chapters API uses the central database client and retains parameterized, case-preserving results', async () => {
  const filename = path.resolve(__dirname, '../pages/api/chapters.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const compiledModule = { exports: {} }; const calls = [];
  const db = { raw: async (sql, bindings) => { calls.push({ sql, bindings }); return { rows: [{ book: 'Genesis', chapter: 1 }, { book: 'Genesis', chapter: 2 }, { book: 'John', chapter: 3 }] }; } };
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, require(name) { assert.equal(name, '@/db'); return db; }, console: { error() {} } });
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  await compiledModule.exports.default({ method: 'GET', query: { books: 'genesis,John' } }, res);
  assert.equal(res.statusCode, 200); assert.equal(JSON.stringify(res.body), JSON.stringify({ genesis: [1, 2], John: [3] }));
  assert.match(calls[0].sql, /unnest\(\?::text\[\]\)/); assert.equal(JSON.stringify(calls[0].bindings), JSON.stringify([['genesis', 'John']]));
});
