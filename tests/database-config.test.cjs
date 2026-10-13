const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const ts = require('typescript');
const { getDatabaseConnection } = require('../lib/database-config');

const pgFields = { PGHOST: 'original.example.test', PGPORT: '5433', PGUSER: 'original_owner', PGPASSWORD: 'offline-test-password', PGDATABASE: 'original_database' };
const current = 'postgresql://current_owner:offline-current@current.example.test/current_database';
const previous = 'postgresql://previous_owner:offline-previous@previous.neon.tech/previous_database?sslmode=require';

test('complete legacy PG configuration preserves its target, port, credentials, and existing TLS default', () => {
  const config = getDatabaseConnection(pgFields);
  assert.deepEqual(config, { host: pgFields.PGHOST, port: 5433, user: pgFields.PGUSER, password: pgFields.PGPASSWORD, database: pgFields.PGDATABASE, ssl: { rejectUnauthorized: false } });
  assert.equal(getDatabaseConnection({ ...pgFields, PGPORT: undefined }).port, 5432);
});

test('current DATABASE_URL wins over archived Neon; complete PG fields retain precedence', () => {
  assert.equal(getDatabaseConnection({ DATABASE_URL: current, NEON_DATABASE_URL: previous }).connectionString, current);
  assert.equal(getDatabaseConnection({ NEON_DATABASE_URL: previous }).connectionString, previous);
  assert.equal(getDatabaseConnection({ PGHOST: 'incomplete-host', DATABASE_URL: current }).connectionString, current);
  assert.equal(getDatabaseConnection({ ...pgFields, DATABASE_URL: current, NEON_DATABASE_URL: previous }).host, pgFields.PGHOST);
  assert.throws(() => getDatabaseConnection({ DATABASE_URL: 'invalid-current-target', NEON_DATABASE_URL: previous }), /Invalid DATABASE_URL/);
});

test('local Helium/loopback URLs work without SSL even in production; external lookalikes retain verified TLS', () => {
  for (const host of ['helium', 'db.helium', 'db.replit.internal', 'localhost', '127.0.0.1', '[::1]', 'db.localhost', 'db.local']) {
    const config = getDatabaseConnection({ DATABASE_URL: `postgresql://owner:offline@${host}/app`, NODE_ENV: 'production' });
    assert.equal(config.ssl, false, host);
  }
  for (const host of ['helium.example.test', 'nothelium', 'localhost.example.test', 'db.internal.example.test', 'current.neon.tech']) {
    const config = getDatabaseConnection({ DATABASE_URL: `postgresql://owner:offline@${host}/app`, NODE_ENV: 'development' });
    assert.deepEqual(config.ssl, { rejectUnauthorized: true }, host);
  }
});

test('URL SSL modes are preserved for the real pg parser and override conflicting PG SSL flags', () => {
  for (const [mode, secure] of [['disable', false], ['require', true], ['verify-ca', true], ['verify-full', true]]) {
    const url = `${current}?sslmode=${mode}`;
    const config = getDatabaseConnection({ DATABASE_URL: url, PGSSL: secure ? 'false' : 'true' });
    assert.equal(config.connectionString, url); assert.equal(Object.hasOwn(config, 'ssl'), false);
    const client = new Client(config); // Inspection only; never call connect().
    if (secure) { assert.ok(client.connectionParameters.ssl); assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false); }
    else assert.equal(client.connectionParameters.ssl, false);
  }
  const localExplicitTls = getDatabaseConnection({ DATABASE_URL: 'postgresql://owner:offline@helium/app?sslmode=verify-full' });
  assert.ok(new Client(localExplicitTls).connectionParameters.ssl);
  assert.deepEqual(getDatabaseConnection({ DATABASE_URL: `${current}?sslmode=` }).ssl, { rejectUnauthorized: true });
});

test('explicit PGSSL and PGSSLMODE options remain effective without changing targets', () => {
  for (const value of ['false', '0', 'off', 'disable']) assert.equal(getDatabaseConnection({ ...pgFields, PGSSL: value }).ssl, false);
  for (const value of ['true', '1', 'on', 'require', 'verify-full']) assert.equal(getDatabaseConnection({ ...pgFields, PGSSL: value }).ssl, true);
  assert.equal(getDatabaseConnection({ DATABASE_URL: current, PGSSL: 'false', PGSSLMODE: 'verify-full' }).ssl, false);
  assert.equal(getDatabaseConnection({ DATABASE_URL: current, PGSSLMODE: 'verify-full' }).ssl, true);
  assert.deepEqual(getDatabaseConnection({ DATABASE_URL: current, PGSSLMODE: 'no-verify' }).ssl, { rejectUnauthorized: false });
  assert.throws(() => getDatabaseConnection({ ...pgFields, PGSSL: 'invalid' }), /Invalid PGSSL/);
});

test('missing or malformed configuration fails clearly without URLs, passwords, or guessed local targets', () => {
  for (const env of [{}, { PGPORT: '5432' }, { DATABASE_URL: 'postgresql://host/database' }, { DATABASE_URL: 'postgresql://owner:DO_NOT_LOG_ME@' }, { DATABASE_URL: 'postgresql://owner:DO_NOT_LOG_ME@host/database?sslmode=invalid' }, { ...pgFields, PGPORT: 'DO_NOT_LOG_ME' }]) {
    assert.throws(() => getDatabaseConnection(env), error => !error.message.includes('DO_NOT_LOG_ME') && !error.message.includes('postgresql://'));
  }
});

test('fresh production imports and Knex initialization work without database credentials; validation is lazy', () => {
  const root = path.resolve(__dirname, '..');
  const script = `
    const assert = require('node:assert/strict');
    const config = require(${JSON.stringify(path.join(root, 'knexfile.js'))});
    const db = require(${JSON.stringify(path.join(root, 'db.js'))});
    assert.equal(typeof config.production.connection, 'function');
    assert.throws(() => config.production.connection(), /Database configuration is missing or incomplete/);
    db.destroy().then(() => process.stdout.write('lazy configuration verified'));
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: os.tmpdir(), env: { NODE_ENV: 'production', PATH: process.env.PATH || '' }, encoding: 'utf8' });
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
