const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'offline-security-test-secret-only';
process.env.CDN_URL = 'https://cdn.example.test/';
process.env.NODE_ENV = 'test';

// Execute real TypeScript handlers with an in-memory query builder and storage
// receipt recorder. No test connects to PostgreSQL, S3, email, or production.
function fixture(extra = {}) {
  const rows = { users: [{ id: 1, username: 'owner', email: 'owner@example.test', password_hash: 'private', is_admin: false }, { id: 2, username: 'other', email: 'other@example.test' }], songs: [], pdfs: [], playlists: [], ...extra };
  const events = [];
  let failDelete = false;
  function db(table) {
    const filters = [];
    let changed = [];
    const query = {
      where(a, b) {
        if (typeof a === 'function') {
          const ors = [];
          a.call({ orWhereIn(column, values) { ors.push(row => values.includes(row[column])); return this; } });
          filters.push(row => ors.some(fn => fn(row)));
        } else if (typeof a === 'object') filters.push(row => Object.entries(a).every(([key, value]) => String(row[key]) === String(value)));
        else filters.push(row => String(row[a]) === String(b));
        return query;
      },
      forUpdate() { return query; },
      orderBy() { return query; },
      insert(data) {
        rows[table] ||= [];
        changed = [{ id: Math.max(0, ...rows[table].map(row => row.id)) + 1, ...data }];
        rows[table].push(...changed); events.push(`insert:${table}`); return query;
      },
      update(data) {
        changed = (rows[table] || []).filter(row => filters.every(fn => fn(row)));
        changed.forEach(row => Object.assign(row, data)); events.push(`update:${table}`); return query;
      },
      async returning() { return changed; },
      then(resolve, reject) { return Promise.resolve((rows[table] || []).filter(row => filters.every(fn => fn(row)))).then(resolve, reject); },
      async first() { return (rows[table] || []).find(row => filters.every(fn => fn(row))); },
      async pluck(column) { return (rows[table] || []).filter(row => filters.every(fn => fn(row))).map(row => row[column]); },
      async delete() {
        if (table === 'songs' && failDelete) throw new Error('Simulated transaction failure');
        const count = (rows[table] || []).filter(row => filters.every(fn => fn(row))).length;
        rows[table] = (rows[table] || []).filter(row => !filters.every(fn => fn(row)));
        events.push(`delete:${table}`);
        return count;
      },
    };
    return query;
  }
  db.transaction = async fn => {
    const snapshot = structuredClone(rows);
    if (!fn) {
      const trx = table => db(table);
      trx.commit = async () => { events.push('commit'); };
      trx.rollback = async () => { Object.keys(rows).forEach(key => delete rows[key]); Object.assign(rows, snapshot); events.push('rollback'); };
      return trx;
    }
    try { const result = await fn(db); events.push('commit'); return result; }
    catch (error) { Object.keys(rows).forEach(key => delete rows[key]); Object.assign(rows, snapshot); events.push('rollback'); throw error; }
  };
  const cache = new Map();
  const mocks = {
    '@/db': db,
    '@/lib/s3': { send: async command => { events.push(`storage:${command.constructor.name}`); return { ContentLength: 20, ContentType: 'audio/mpeg' }; } },
    '@/lib/db-utils': { refreshProgressMaterializedView: async () => { events.push('refresh'); } },
    '@/auth': {
      auth: async () => ({ user: { id: '1' } }),
      handlers: {
        POST: async request => {
          events.push({ authRequest: await request.text(), contentType: request.headers.get('content-type') });
          const headers = new Headers(); headers.append('Set-Cookie', 'csrf=one; Path=/'); headers.append('Set-Cookie', 'session=two; Path=/');
          return new Response('complete', { headers });
        },
      },
    },
    '@aws-sdk/s3-request-presigner': { getSignedUrl: async (_client, command) => { events.push({ signed: command.input }); return 'https://signed.example.test/upload'; } },
  };
  function load(name) {
    if (name in mocks) return mocks[name];
    const filename = path.resolve(__dirname, '..', name.startsWith('@/') ? name.slice(2) + '.ts' : name);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const requireModule = dependency => dependency in mocks ? mocks[dependency] : dependency.startsWith('@/') ? load(dependency) : require(dependency);
    vm.runInNewContext(source, { exports: module.exports, module, require: requireModule, process, Buffer, URL, URLSearchParams, Headers, console: { log() {}, error() {} } }, { filename });
    return module.exports;
  }
  function request(token, { method = 'POST', body = {}, query = {}, cookies = {}, headers = {} } = {}) {
    return { method, body, query, cookies, headers: { host: 'biblechorus.test', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } };
  }
  function response() {
    return { statusCode: 200, headers: {}, headersSent: false, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; this.headersSent = true; return this; }, setHeader(name, value) { this.headers[name] = value; }, getHeader(name) { return this.headers[name]; }, send(body) { this.body = body; this.headersSent = true; return this; }, end(body) { this.body = body; this.headersSent = true; return this; } };
  }
  return { rows, events, load, request, response, failSongDelete() { failDelete = true; } };
}
const token = id => jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1h' });

test('server identity accepts bearer, cookie, and Google sessions, strips password hashes, and rejects forged/expired tokens', async () => {
  const f = fixture(); const { getAuthenticatedUser } = f.load('@/lib/server-auth');
  for (const req of [f.request(token(1)), f.request(null, { cookies: { token: token(1) } }), f.request(null, { cookies: { '__Secure-next-auth.session-token': 'google-session' } })]) {
    const user = await getAuthenticatedUser(req, f.response());
    assert.equal(user.id, 1); assert.equal(user.password_hash, undefined);
  }
  assert.equal(await getAuthenticatedUser(f.request(jwt.sign({ userId: 1 }, 'wrong-secret')), f.response()), null);
  assert.equal(await getAuthenticatedUser(f.request(jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: -1 })), f.response()), null);
  assert.equal(await getAuthenticatedUser(f.request(token(999)), f.response()), null);
  assert.equal(await getAuthenticatedUser(f.request('invalid', { cookies: { token: token(1), '__Secure-next-auth.session-token': 'google-session' } }), f.response()), null);
});

test('legacy mutation boundary derives attribution, rejects other owners and cross-origin writes, and leaves public reads available', async () => {
  const f = fixture({ songs: [{ id: 10, uploaded_by: 1 }] });
  const { withApiAuth } = f.load('@/lib/server-auth'); let calls = 0;
  const handler = withApiAuth(async (req, res) => { calls++; res.json({ user_id: req.body.user_id }); }, { methods: ['PUT'], owner: 'songs', identityFields: ['user_id'] });
  const authorized = f.response(); await handler(f.request(token(1), { method: 'PUT', query: { id: '10' }, body: { user_id: 2 } }), authorized);
  assert.equal(authorized.body.user_id, 1);
  for (const [req, status] of [[f.request(null, { method: 'PUT', query: { id: '10' } }), 401], [f.request(token(2), { method: 'PUT', query: { id: '10' } }), 403], [f.request(token(1), { method: 'PUT', query: { id: '10' }, headers: { origin: 'https://attacker.test' } }), 403], [f.request(token(1), { method: 'PUT', query: { id: ['10', '11'] } }), 400]]) {
    const res = f.response(); await handler(req, res); assert.equal(res.statusCode, status);
  }
  const publicRead = f.response(); await handler(f.request(null, { method: 'GET' }), publicRead);
  assert.equal(publicRead.statusCode, 200); assert.equal(calls, 2);
});

test('session restores a real user and creates an HttpOnly cookie; logout expires it', async () => {
  const f = fixture(); const session = f.load('pages/api/auth/session.ts').default;
  const res = f.response(); await session(f.request(token(1), { method: 'GET' }), res);
  assert.equal(res.body.user.id, 1); assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).userId, 1);
  assert.match(res.headers['Set-Cookie'], /HttpOnly/); assert.match(res.headers['Set-Cookie'], /SameSite=Lax/);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  const logout = f.load('pages/api/auth/logout.ts').default; const out = f.response(); logout(f.request(null), out);
  assert.match(out.headers['Set-Cookie'], /Max-Age=0/);
});

test('Auth.js Pages bridge preserves form encoding and separate Set-Cookie values', async () => {
  const f = fixture(); const bridge = f.load('pages/api/auth/[...nextauth].ts').default;
  const req = f.request(null, { body: { csrfToken: 'token with + symbols', callbackUrl: 'https://biblechorus.test/profile' }, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  req.url = '/api/auth/signin/google';
  const res = f.response(); await bridge(req, res);
  assert.equal(f.events[0].contentType, 'application/x-www-form-urlencoded');
  const form = new URLSearchParams(f.events[0].authRequest); assert.equal(form.get('csrfToken'), 'token with + symbols');
  assert.equal(res.headers['Set-Cookie'].length, 2); assert.equal(res.body, 'complete');
  const { setSessionCookie } = f.load('@/lib/server-auth'); setSessionCookie(res, token(1));
  assert.equal(res.headers['Set-Cookie'].length, 3); assert.match(res.headers['Set-Cookie'][2], /^token=/);
});

test('storage keys preserve raw, leading slash, and CDN forms and reject cross-user keys and path tricks', () => {
  const f = fixture(); const { ownedStorageKey } = f.load('@/lib/storage-keys');
  for (const value of ['uploads/1/audio/song.mp3', '/uploads/1/audio/song.mp3', 'https://cdn.example.test/uploads/1/audio/song.mp3']) assert.equal(ownedStorageKey(value, 1), 'uploads/1/audio/song.mp3');
  for (const value of ['uploads/2/audio/song.mp3', 'uploads/10/audio/song.mp3', 'uploads/1/../2/song.mp3', 'uploads/1/%2e%2e/song.mp3', 'https://untrusted.test/uploads/1/song.mp3']) assert.throws(() => ownedStorageKey(value, 1));
});

test('cleanup rejects saved content, including source media and season photos, before any storage operation', async () => {
  const cases = [['songs', 'audio_url'], ['songs', 'song_art_url'], ['pdfs', 'file_url'], ['pdfs', 'image_url'], ['playlists', 'cover_art_url'], ['users', 'profile_image_url'], ['journey_profiles', 'cover_image_url'], ['seasons', 'cover_image_url'], ['journey_season_songs', 'source_url'], ['journey_season_important_dates', 'photo_url']];
  for (const [table, field] of cases) {
    const f = fixture(); f.rows[table] ||= []; f.rows[table].push({ id: 50, [field]: 'https://cdn.example.test/uploads/1/audio/committed.mp3' });
    const handler = f.load('pages/api/cleanup-unsubmitted-files.ts').default;
    const res = f.response(); await handler(f.request(token(1), { body: { fileKeys: ['uploads/1/audio/unsubmitted.mp3', '/uploads/1/audio/committed.mp3'] } }), res);
    assert.equal(res.statusCode, 409, `${table}.${field}`); assert.equal(f.events.length, 0);
  }
});

test('authenticated unload beacon removes only unsubmitted files and rejects unauthenticated or cross-user deletion', async () => {
  const f = fixture(); const cleanup = f.load('pages/api/cleanup-unsubmitted-files.ts').default;
  const res = f.response(); await cleanup(f.request(null, { cookies: { token: token(1) }, body: JSON.stringify({ fileKeys: ['uploads/1/audio/draft.mp3'] }) }), res);
  assert.equal(res.statusCode, 200); assert.equal(f.events.filter(event => typeof event === 'string' && event.startsWith('storage:')).length, 1);
  const remove = f.load('pages/api/delete-file.ts').default;
  const wrong = f.response(); await remove(f.request(token(2), { body: { fileKey: 'uploads/1/audio/draft.mp3' } }), wrong); assert.equal(wrong.statusCode, 403);
  const anonymous = f.response(); await remove(f.request(null, { body: { fileKey: 'uploads/1/audio/draft.mp3' } }), anonymous); assert.equal(anonymous.statusCode, 401);
});

test('upload URL uses session owner, bounded signed length, supported formats, and collision-resistant keys', async () => {
  const f = fixture(); const upload = f.load('pages/api/upload-url.ts').default;
  const body = { fileType: 'audio/mpeg', fileExtension: 'mp3', title: 'My song', fileSize: 100, userId: 2 };
  const a = f.response(); const b = f.response(); await upload(f.request(token(1), { body: { ...body } }), a); await upload(f.request(token(1), { body: { ...body } }), b);
  assert.equal(a.statusCode, 200); assert.match(a.body.fileKey, /^uploads\/1\/audio\//); assert.notEqual(a.body.fileKey, b.body.fileKey);
  assert.equal(f.events[0].signed.ContentLength, 100);
  const large = f.response(); await upload(f.request(token(1), { body: { ...body, fileSize: 201 * 1024 * 1024 } }), large); assert.equal(large.statusCode, 400);
  const invalid = f.response(); await upload(f.request(token(1), { body: { ...body, fileSize: 'invalid' } }), invalid); assert.equal(invalid.statusCode, 400);
});

test('real S3 presigner signs browser upload size/type without an empty-body checksum', async () => {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../lib/s3.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require, process: { env: { AWS_REGION: 'us-east-1', AWS_ACCESS_KEY: 'OFFLINE_TEST_KEY', AWS_SECRET_KEY: 'offline-test-secret' } } });
  const client = module.exports.default;
  const url = new URL(await getSignedUrl(client, new PutObjectCommand({ Bucket: 'offline-test-bucket', Key: 'uploads/1/audio/test.mp3', ContentType: 'audio/mpeg', ContentLength: 123 }), { expiresIn: 900, signableHeaders: new Set(['content-type']) }));
  assert.equal(url.searchParams.get('X-Amz-SignedHeaders'), 'content-length;content-type;host');
  assert.equal(url.searchParams.get('X-Amz-Expires'), '900');
  assert.equal(url.searchParams.has('x-amz-checksum-crc32'), false);
  assert.equal(url.searchParams.has('x-amz-sdk-checksum-algorithm'), false);
  client.destroy();
});

test('legacy user-song submission delegates to canonical validation, adapts genre, and cannot bypass upload ownership', async () => {
  const f = fixture(); const legacy = f.load('pages/api/users/[id]/songs.ts').default;
  const body = { title: 'Legacy song', genre: 'Acoustic', audio_url: 'uploads/1/audio/song.mp3', uploaded_by: 2, lyrics: 'A testimony', duration: 42, lyrics_scripture_adherence: 'no_connection', music_origin: 'human' };
  const created = f.response(); await legacy(f.request(token(1), { query: { id: '1' }, body: { ...body } }), created);
  assert.equal(created.statusCode, 201); assert.equal(created.body.id, 1);
  assert.equal(f.rows.songs[0].uploaded_by, 1); assert.deepEqual(Array.from(f.rows.songs[0].genres), ['Acoustic']); assert.equal(f.rows.songs[0].genre, undefined);
  assert.ok(f.events.some(event => event === 'storage:HeadObjectCommand'));
  const count = f.rows.songs.length;
  const otherFile = f.response(); await legacy(f.request(token(1), { query: { id: '1' }, body: { ...body, audio_url: 'uploads/2/audio/song.mp3' } }), otherFile);
  assert.equal(otherFile.statusCode, 403); assert.equal(f.rows.songs.length, count);
  const incomplete = f.response(); await legacy(f.request(token(1), { query: { id: '1' }, body: { ...body, duration: undefined } }), incomplete);
  assert.equal(incomplete.statusCode, 400); assert.equal(f.rows.songs.length, count);
  const otherProfile = f.response(); await legacy(f.request(token(2), { query: { id: '1' }, body: { ...body } }), otherProfile);
  assert.equal(otherProfile.statusCode, 403); assert.equal(f.rows.songs.length, count);
});

test('song deletion does not touch storage when database rolls back; success refreshes only after commit and retains shared files', async () => {
  const song = { id: 10, uploaded_by: 1, audio_url: 'https://cdn.example.test/uploads/1/audio/song.mp3', genres: [] };
  const failing = fixture({ songs: [{ ...song }] }); failing.failSongDelete();
  const failure = failing.response(); await failing.load('pages/api/songs/[id]/delete.ts').default(failing.request(token(1), { method: 'DELETE', query: { id: '10' } }), failure);
  assert.equal(failure.statusCode, 500); assert.equal(failing.rows.songs.length, 1); assert.equal(failing.events.some(event => event.startsWith('storage:')), false);
  const passing = fixture({ songs: [{ ...song }, { id: 11, uploaded_by: 1, audio_url: song.audio_url }] });
  const success = passing.response(); await passing.load('pages/api/songs/[id]/delete.ts').default(passing.request(token(1), { method: 'DELETE', query: { id: '10' } }), success);
  assert.equal(success.statusCode, 200); assert.ok(passing.events.indexOf('commit') < passing.events.indexOf('refresh')); assert.equal(passing.events.some(event => event.startsWith('storage:')), false);
});

test('moderation checks database roles and locked topics reject all new replies', async () => {
  const f = fixture({ forum_topics: [{ id: 10, user_id: 1, is_locked: true }] });
  const comment = f.load('pages/api/forum/topics/[id]/comments.ts').default;
  const closed = f.response(); await comment(f.request(token(1), { query: { id: '10' }, body: { content: 'A reply', is_moderator: true } }), closed);
  assert.equal(closed.statusCode, 403); assert.equal(f.events.some(event => event.startsWith('insert:')), false);
  const lock = f.load('pages/api/forum/topics/[id]/lock.ts').default;
  const forged = f.response(); await lock(f.request(token(2), { method: 'PATCH', query: { id: '10' }, body: { is_moderator: true, user_id: 1 } }), forged);
  assert.equal(forged.statusCode, 403);
  f.rows.users[1].is_moderator = true;
  const authorized = f.response(); await lock(f.request(token(2), { method: 'PATCH', query: { id: '10' } }), authorized);
  assert.equal(authorized.statusCode, 200); assert.equal(authorized.body.is_locked, true);
});

test('private PDF notes remain isolated and only their author can delete them', async () => {
  const f = fixture({ pdfs: [{ id: 10, uploaded_by: 1, is_public: false }, { id: 11, uploaded_by: 1, is_public: true }], pdf_notes: [{ id: 50, pdf_id: 11, user_id: 1, note: 'Private reflection' }, { id: 51, pdf_id: 11, user_id: 2, note: 'Another reader' }] });
  const notes = f.load('pages/api/pdfs/[id]/notes.ts').default;
  const denied = f.response(); await notes(f.request(token(2), { method: 'GET', query: { id: '10' } }), denied); assert.equal(denied.statusCode, 404);
  const own = f.response(); await notes(f.request(token(1), { method: 'GET', query: { id: '11' } }), own); assert.equal(own.body.length, 1); assert.equal(own.body[0].note, 'Private reflection');
  const created = f.response(); await notes(f.request(token(1), { query: { id: '11' }, body: { note: 'New reflection', user_id: 2, page_number: 3 } }), created); assert.equal(created.statusCode, 201); assert.equal(created.body.user_id, 1);
  assert.equal(created.body.note, 'New reflection'); assert.equal(created.body.content, undefined);
  assert.equal(f.rows.pdf_notes.find(note => note.id === 50).note, 'Private reflection');
  assert.equal(f.rows.pdf_notes.some(note => Object.hasOwn(note, 'content')), false);
  const remove = f.load('pages/api/pdfs/[id]/notes/[noteId].ts').default;
  const other = f.response(); await remove(f.request(token(2), { method: 'DELETE', query: { id: '11', noteId: '50' } }), other); assert.equal(other.statusCode, 404); assert.ok(f.rows.pdf_notes.some(note => note.id === 50));
  const deleted = f.response(); await remove(f.request(token(1), { method: 'DELETE', query: { id: '11', noteId: '50' } }), deleted); assert.equal(deleted.statusCode, 200); assert.equal(f.rows.pdf_notes.some(note => note.id === 50), false);
});
