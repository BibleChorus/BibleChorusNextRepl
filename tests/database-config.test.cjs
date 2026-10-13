const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const ts = require('typescript');

// Execute the real Knex configuration with an isolated environment; no pool is
// connected and no credentials from the developer's environment are inspected.
function configuration(env) {
  const result = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../knexfile.js'), 'utf8'), {
    module: result, process: { env },
    require(name) { assert.equal(name, 'dotenv'); return { config() {} }; },
  });
  return result.exports;
}

const current = 'postgresql://current_owner:offline-current@current.example.test/current_database?sslmode=verify-full';

test('the current DATABASE_URL is passed directly to pg, and URL resolution remains lazy', () => {
  const env = {}; const config = configuration(env);
  env.DATABASE_URL = current;
  for (const environment of ['development', 'production', 'test']) {
    const connection = config[environment].connection();
    assert.equal(connection.connectionString, current);
    assert.deepEqual(Object.keys(connection), ['connectionString']);
    const client = new Client(connection); // Inspect native parsing; never connect.
    assert.equal(client.connectionParameters.host, 'current.example.test');
    assert.equal(client.connectionParameters.database, 'current_database');
    assert.equal(client.connectionParameters.user, 'current_owner');
    assert.ok(client.connectionParameters.ssl);
    assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false);
  }
});

test('saved Neon and individual PG variables never select a fallback database', () => {
  const old = { NEON_DATABASE_URL: 'postgresql://old:DO_NOT_LOG_ME@old.neon.tech/old_database', PGHOST: 'old-host', PGUSER: 'old-owner', PGDATABASE: 'old-database', PGPASSWORD: 'DO_NOT_LOG_ME' };
  const config = configuration(old);
  assert.throws(() => config.production.connection(), error => error.message === 'DATABASE_URL is required to connect to the database.');
  old.DATABASE_URL = current;
  assert.equal(config.production.connection().connectionString, current);
});

test('native URL TLS modes control local and external connections without app overrides', () => {
  for (const [url, secure] of [
    ['postgresql://owner:offline@helium/app?sslmode=disable', false],
    ['postgresql://owner:offline@helium/app?sslmode=verify-full', true],
    ['postgresql://owner:offline@external.example.test/app?sslmode=disable', false],
    [current, true],
  ]) {
    const connection = configuration({ DATABASE_URL: url, NODE_ENV: 'production' }).production.connection();
    assert.equal(Object.hasOwn(connection, 'ssl'), false);
    const ssl = new Client(connection).connectionParameters.ssl;
    if (secure) { assert.ok(ssl); assert.notEqual(ssl.rejectUnauthorized, false); }
    else assert.equal(ssl, false);
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
