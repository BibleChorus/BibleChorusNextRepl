const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Readable, Writable } = require('node:stream');
const { EventEmitter } = require('node:events');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'offline-originals-test-secret';
process.env.NODE_ENV = 'test';
process.env.AWS_S3_BUCKET_NAME = 'offline-public-content';
process.env.JOURNEY_ORIGINALS_BUCKET = 'offline-private-originals';
process.env.JOURNEY_ORIGINALS_STORAGE_VERIFIED = 'true';

const token = id => jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const routes = {
  index: 'pages/api/journeys/originals/index.ts',
  original: 'pages/api/journeys/originals/[id]/index.ts',
  retry: 'pages/api/journeys/originals/[id]/upload-url.ts',
  finalize: 'pages/api/journeys/originals/[id]/finalize.ts',
  file: 'pages/api/journeys/originals/[id]/file.ts',
  reorder: 'pages/api/journeys/originals/reorder.ts',
};

// These fixtures execute actual TypeScript routes and shared authorization code.
// Database queries, storage commands, and Bible-text fetching are offline only.
function fixture(extra = {}, options = {}) {
  const rows = {
    users: [{ id: 1, username: 'owner' }, { id: 2, username: 'other' }],
    journey_profiles: [{ id: 5, user_id: 1, title: 'Faith journey', is_public: true, created_at: '2026-01-01' }],
    seasons: [{ id: 10, user_id: 1, title: 'Children', is_visible: true, start_date: '2026-01-01', display_order: 0 }],
    journey_season_songs: [{ id: 20, season_id: 10, song_id: 30, display_order: 0, personal_note: 'Existing reflection', source_url: 'https://onedrive.example.test/original' }],
    songs: [{ id: 30, uploaded_by: 1, title: 'Finished song', artist: 'Creator', created_at: '2026-01-01', lyrics: 'Finished lyrics' }],
    journey_originals: [], song_verses: [], bible_verses: [], journey_season_important_dates: [],
    ...extra,
  };
  const events = [];
  const errors = [];
  const objects = new Map();
  const field = (row, column) => row[column] ?? row[column.replace(/^.*\./, '')];
  const compare = (a, op, b) => op === '=' ? String(a) === String(b) : op === '!=' || op === '<>' ? String(a) !== String(b) : op === '>' ? a > b : op === '>=' ? a >= b : op === '<' ? a < b : a <= b;
  const tableName = value => value.split(/\s+(?:as\s+)?/i)[0];
  function db(input) {
    const table = tableName(input);
    const alias = input.split(/\s+/).at(-1);
    const filters = [];
    const joins = [];
    const order = [];
    let columns = [];
    let changed;
    let aggregate;
    let counted;
    function candidates() {
      let result = (rows[table] || []).map(row => ({ ...row, ...Object.fromEntries(Object.entries(row).flatMap(([key, value]) => [[`${table}.${key}`, value], [`${alias}.${key}`, value]])) }));
      for (const [joinInput, left, right] of joins) {
        const joinTable = tableName(joinInput);
        const joinAlias = joinInput.split(/\s+/).at(-1);
        result = result.flatMap(base => (rows[joinTable] || []).flatMap(row => {
          const combined = { ...base, ...Object.fromEntries(Object.entries(row).flatMap(([key, value]) => [[`${joinTable}.${key}`, value], [`${joinAlias}.${key}`, value]])) };
          return String(field(combined, left)) === String(field(combined, right)) ? [combined] : [];
        }));
      }
      result = result.filter(row => filters.every(filter => filter(row)));
      for (const [column, direction] of [...order].reverse()) result.sort((a, b) => (field(a, column) > field(b, column) ? 1 : field(a, column) < field(b, column) ? -1 : 0) * (direction === 'desc' ? -1 : 1));
      if (aggregate) {
        const [column, name] = aggregate.split(/\s+as\s+/i);
        return [{ [name || column]: result.length ? Math.max(...result.map(row => Number(field(row, column)))) : null }];
      }
      if (counted) return [{ [counted.split(/\s+as\s+/i)[1] || 'count']: result.length }];
      if (!columns.length) return result.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !key.includes('.'))));
      return result.map(row => {
        const projection = {};
        for (const column of columns) {
          if (column === '*' || column === `${table}.*`) Object.assign(projection, Object.fromEntries(Object.entries(row).filter(([key]) => !key.includes('.'))));
          else {
            const [key, name] = column.split(/\s+as\s+/i);
            projection[name || key.replace(/^.*\./, '')] = field(row, key);
          }
        }
        return projection;
      });
    }
    const query = {
      where(a, b, c) {
        if (typeof a === 'function') {
          const alternatives = [];
          a.call({ orWhereIn(column, values) { alternatives.push(row => values.includes(field(row, column))); return this; } });
          filters.push(row => alternatives.some(filter => filter(row)));
        } else if (typeof a === 'object') filters.push(row => Object.entries(a).every(([key, value]) => compare(field(row, key), '=', value)));
        else filters.push(row => compare(field(row, a), c === undefined ? '=' : b, c === undefined ? b : c));
        return query;
      },
      whereIn(column, values) { filters.push(row => values.map(String).includes(String(field(row, column)))); return query; },
      whereNull(column) { filters.push(row => field(row, column) == null); return query; },
      whereNotNull(column) { filters.push(row => field(row, column) != null); return query; },
      whereRaw() { return query; },
      join(table, left, right) { joins.push([table, left, right]); return query; },
      select(...values) { columns.push(...values.flat()); return query; },
      orderBy(column, direction) { order.push([column, direction]); return query; },
      orderByRaw() { return query; },
      max(value) { aggregate = value; return query; },
      forUpdate() { return query; },
      limit() { return query; },
      insert(data) {
        if (table === options.failInsertTable) throw new Error(`Offline database failure; private bindings: ${JSON.stringify(data)}`);
        rows[table] ||= [];
        changed = (Array.isArray(data) ? data : [data]).map(value => ({ id: Math.max(0, ...rows[table].map(row => row.id)) + 1, created_at: '2026-10-13', updated_at: '2026-10-13', ...value }));
        rows[table].push(...changed); events.push({ database: 'insert', table }); return query;
      },
      update(data) {
        changed = (rows[table] || []).filter(row => filters.every(filter => filter(row)));
        changed.forEach(row => Object.assign(row, data)); events.push({ database: 'update', table }); return query;
      },
      async returning() { return structuredClone(changed || []); },
      async first(...values) { if (values.length) columns.push(...values); return candidates()[0]; },
      async pluck(column) { return candidates().map(row => field(row, column)); },
      count(value = '* as count') { counted = value; return query; },
      async delete() {
        const matches = new Set(candidates().map(row => row.id));
        const count = matches.size; rows[table] = (rows[table] || []).filter(row => !matches.has(row.id));
        events.push({ database: 'delete', table }); return count;
      },
      then(resolve, reject) { return Promise.resolve(changed || candidates()).then(resolve, reject); },
    };
    return query;
  }
  db.fn = { now: () => '2026-10-13T12:00:00Z' };
  db.transaction = async callback => {
    const snapshot = structuredClone(rows);
    try { const result = await callback(db); events.push({ transaction: 'commit' }); return result; }
    catch (error) { Object.keys(rows).forEach(key => delete rows[key]); Object.assign(rows, snapshot); events.push({ transaction: 'rollback' }); throw error; }
  };
  const s3 = {
    async send(command) {
      const name = command.constructor.name;
      const input = command.input;
      events.push({ storage: name, input });
      if (options.storageError === name) throw new Error('Simulated offline storage error');
      if (name === 'GetPublicAccessBlockCommand') return { PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true, ...options.publicAccess } };
      if (name === 'GetBucketPolicyStatusCommand') return { PolicyStatus: { IsPublic: options.publicPolicy || false } };
      if (name === 'GetBucketOwnershipControlsCommand') return { OwnershipControls: { Rules: [{ ObjectOwnership: options.ownership || 'BucketOwnerEnforced' }] } };
      if (name === 'GetBucketPolicyCommand') {
        if (options.bucketPolicy !== undefined) return { Policy: JSON.stringify(options.bucketPolicy) };
        throw Object.assign(new Error('No policy'), { name: 'NoSuchBucketPolicy' });
      }
      if (name === 'DeleteObjectCommand') { objects.delete(input.Key); return {}; }
      if (name === 'CopyObjectCommand') {
        options.beforeCopy?.(objects, input);
        const key = decodeURIComponent(input.CopySource).replace(/^\/?[^/]+\//, '');
        const object = objects.get(key);
        if (!object || (input.CopySourceIfMatch && input.CopySourceIfMatch !== object.ETag)) throw new Error('Invalid copy precondition');
        objects.set(input.Key, { ...object }); return { CopyObjectResult: { ETag: object.ETag } };
      }
      const object = objects.get(input.Key);
      if (!object) throw Object.assign(new Error('Offline object missing'), { name: 'NoSuchKey' });
      if (name === 'HeadObjectCommand') return { ...object, Body: undefined };
      if (name === 'GetObjectCommand') {
        if (input.IfMatch && input.IfMatch !== object.ETag) throw new Error('Object changed before prefix validation');
        let bytes = object.bytes;
        let contentRange;
        const match = input.Range?.match(/^bytes=(\d+)-(\d*)$/);
        if (match) {
          const start = Number(match[1]); const end = match[2] ? Number(match[2]) : bytes.length - 1;
          bytes = bytes.subarray(start, end + 1); contentRange = `bytes ${start}-${Math.min(end, object.bytes.length - 1)}/${object.bytes.length}`;
        }
        const body = Readable.from([bytes]);
        body.transformToByteArray = async () => bytes;
        return { ...object, Body: body, ContentLength: bytes.length, ContentRange: contentRange };
      }
      throw new Error(`Unmocked storage command ${name}`);
    },
  };
  const mocks = {
    '@/db': db, '@/lib/s3': s3,
    '@/auth': { auth: async () => ({ user: { id: '1' } }) },
    'axios': { post: async () => ({ data: [] }) },
    '@aws-sdk/s3-request-presigner': { getSignedUrl: async (_client, command, config) => { events.push({ signed: command.input, config }); if (options.signingError) throw new Error('Offline signing interruption'); return 'https://signed.example.test/upload-only'; } },
  };
  const cache = new Map();
  function load(name) {
    if (name in mocks) return mocks[name];
    const filename = path.resolve(__dirname, '..', name.startsWith('@/') ? `${name.slice(2)}.ts` : name);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} }; cache.set(filename, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const requireModule = name => name in mocks ? mocks[name] : name.startsWith('@/') ? load(name) : require(name);
    vm.runInNewContext(source, { exports: loadedModule.exports, module: loadedModule, require: requireModule, process, Buffer, URL, Headers, AbortController, console: { log() {}, warn() {}, error(...values) { errors.push(values); } }, setTimeout, clearTimeout }, { filename });
    return loadedModule.exports;
  }
  const request = (userId, { method = 'GET', body = {}, query = {}, headers = {}, cookies = {} } = {}) => Object.assign(new EventEmitter(), { method, body, query, cookies, headers: { host: 'biblechorus.test', ...(userId ? { authorization: `Bearer ${token(userId)}` } : {}), ...headers } });
  function response() {
    const chunks = [];
    const res = new Writable({ write(chunk, _encoding, callback) { this.headersSent = true; chunks.push(Buffer.from(chunk)); callback(); } });
    res.statusCode = 200; res.headers = {}; res.headersSent = false;
    res.status = function(code) { this.statusCode = code; return this; };
    res.json = function(body) { this.body = body; this.headersSent = true; this.end(); return this; };
    res.send = function(body) { this.body = body; this.headersSent = true; this.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : undefined); return this; };
    res.setHeader = function(name, value) { this.headers[name.toLowerCase()] = value; };
    res.getHeader = function(name) { return this.headers[name.toLowerCase()]; };
    res.bytes = () => Buffer.concat(chunks);
    return res;
  }
  async function call(route, userId, input) {
    const res = response(); await load(routes[route] || route).default(request(userId, input), res);
    if (!res.writableFinished && !res.destroyed) await new Promise(resolve => { res.once('finish', resolve); res.once('close', resolve); });
    return res;
  }
  function put(key, { type = 'audio/mpeg', bytes = Buffer.from('ID3private original audio'), size = bytes.length, etag = '"offline-object-etag"' } = {}) {
    objects.set(key, { ContentType: type, ContentLength: size, ETag: etag, bytes });
  }
  return { rows, events, errors, objects, load, call, put, request, response };
}

const journal = (id, changes = {}) => ({ id, journey_entry_id: 20, owner_id: 1, kind: 'journal', label: `Journal ${id}`, display_order: id, is_shared: false, status: 'ready', journal_text: 'Private journal words', file_name: null, mime_type: null, byte_size: null, storage_bucket: null, object_key: null, upload_key: null, created_at: '2026-10-13', updated_at: '2026-10-13', ...changes });
const audio = (id, changes = {}) => journal(id, { kind: 'audio', journal_text: null, file_name: 'recording.mp3', mime_type: 'audio/mpeg', byte_size: 25, storage_bucket: 'offline-private-originals', upload_key: `journey-originals/pending/1/${id}`, object_key: `journey-originals/ready/1/${id}`, ...changes });

function assertNoStorageLocation(value) {
  const json = JSON.stringify(value);
  for (const secret of ['object_key', 'upload_key', 'request_id', 'request_digest', 'offline-private-originals', 'journey-originals/ready/', 'journey-originals/pending/', 'signed.example.test', 'cdn.example.test']) assert.equal(json.includes(secret), false, `Response must not expose ${secret}`);
}

test('private bucket gate fails closed for missing config, public access, alternate policy grants, and inspection failures', async () => {
  const config = process.env.JOURNEY_ORIGINALS_BUCKET;
  try {
    for (const bucket of ['', process.env.AWS_S3_BUCKET_NAME]) {
      process.env.JOURNEY_ORIGINALS_BUCKET = bucket;
      const f = fixture();
      await assert.rejects(f.load('@/lib/journey-originals-storage').requireOriginalStorage(), error => error.status === 503);
      assert.equal(f.events.length, 0);
    }
  } finally { process.env.JOURNEY_ORIGINALS_BUCKET = config; }
  for (const options of [
    { publicAccess: { BlockPublicAcls: false } }, { publicAccess: { RestrictPublicBuckets: false } },
    { publicPolicy: true }, { ownership: 'ObjectWriter' },
    { bucketPolicy: { Statement: [{ Effect: 'Allow', Principal: { Service: 'cloudfront.amazonaws.com' } }] } },
    { storageError: 'GetBucketPolicyCommand' }, { storageError: 'GetBucketOwnershipControlsCommand' },
  ]) {
    const f = fixture({}, options);
    await assert.rejects(f.load('@/lib/journey-originals-storage').requireOriginalStorage(), error => error.status === 503);
    assert.equal(f.events.some(event => event.signed || event.storage === 'GetObjectCommand'), false);
  }
  const safe = fixture({}, { bucketPolicy: { Statement: [{ Effect: 'Deny', Principal: '*' }] } });
  assert.equal(await safe.load('@/lib/journey-originals-storage').requireOriginalStorage(), config);
});

test('metadata policy hides private and pending originals from other viewers and bounds shared originals by journey visibility', async () => {
  const f = fixture({ journey_originals: [journal(1), journal(2, { is_shared: true, journal_text: 'Shared journal' }), audio(3, { status: 'pending', object_key: null })] });
  const { listOriginals, readableOriginal } = f.load('@/lib/journey-originals');
  assert.deepEqual(Array.from(await listOriginals(20, null), row => row.id), [2]);
  assert.deepEqual(Array.from(await listOriginals(20, 2), row => row.id), [2]);
  const own = await listOriginals(20, 1);
  assert.deepEqual(Array.from(own, row => row.id), [1, 2, 3]); assertNoStorageLocation(own);
  for (const id of [1, 3]) await assert.rejects(readableOriginal(id, 2), error => error.status === 404);
  for (const [target, key] of [[f.rows.journey_profiles[0], 'is_public'], [f.rows.seasons[0], 'is_visible']]) {
    target[key] = false;
    for (const viewer of [null, 2]) {
      await assert.rejects(listOriginals(20, viewer), error => error.status === 404);
      await assert.rejects(readableOriginal(2, viewer), error => error.status === 404);
    }
    assert.equal((await listOriginals(20, 1)).length, 3); target[key] = true;
  }
  f.rows.journey_originals[1].owner_id = 2;
  await assert.rejects(readableOriginal(2, 2), error => error.status === 404);
  assert.equal((await listOriginals(20, 1)).some(row => row.id === 2), false, 'Attribution must match the actual parent entry');
});

test('finalization checks the actual object length, MIME, format signature and conditional immutable copy before accepting a file', async () => {
  const pending = audio(7, { status: 'pending', object_key: null });
  for (const object of [
    { size: pending.byte_size - 1 }, { size: pending.byte_size + 1 },
    { type: 'audio/unknown' }, { type: 'application/pdf' },
    { bytes: Buffer.alloc(pending.byte_size) }, { etag: '' },
  ]) {
    const f = fixture(); f.put(pending.upload_key, object);
    await assert.rejects(f.load('@/lib/journey-originals-storage').finalizeOriginalFile(pending), error => error.status === 400);
    assert.equal(f.events.some(event => event.storage === 'CopyObjectCommand'), false);
  }
  const f = fixture(); f.put(pending.upload_key);
  const key = await f.load('@/lib/journey-originals-storage').finalizeOriginalFile(pending);
  assert.match(key, /^journey-originals\/ready\/1\//);
  assert.notEqual(key, pending.upload_key);
  assert.ok(f.objects.has(key));
  const copy = f.events.find(event => event.storage === 'CopyObjectCommand');
  assert.equal(copy.input.CopySourceIfMatch, '"offline-object-etag"');
  assert.equal(copy.input.CacheControl, 'no-store');
  const prefix = f.events.find(event => event.storage === 'GetObjectCommand');
  assert.equal(prefix.input.IfMatch, '"offline-object-etag"');
  const raced = fixture({}, { beforeCopy(objects) { objects.get(pending.upload_key).ETag = '"changed-object"'; } });
  raced.put(pending.upload_key);
  await assert.rejects(raced.load('@/lib/journey-originals-storage').finalizeOriginalFile(pending), error => error.status === 400);
  assert.equal([...raced.objects.keys()].some(key => key.includes('/ready/')), false, 'A file replaced after signature validation must not become ready');
});

test('file validation permits only bounded audio, raster images and PDFs; ranges are bounded single byte ranges', () => {
  const f = fixture();
  const { validOriginalFile, ORIGINAL_FILE_LIMITS, matchesOriginalSignature } = f.load('@/lib/journey-originals-validation');
  for (const [kind, mime, bytes] of [
    ['audio', 'audio/mpeg', Buffer.from('ID3audio')],
    ['audio', 'audio/wav', Buffer.from('RIFF0000WAVE')],
    ['audio', 'audio/ogg', Buffer.from('OggSaudio')],
    ['audio', 'audio/flac', Buffer.from('fLaCaudio')],
    ['audio', 'audio/mp4', Buffer.from('0000ftypM4A ')],
    ['image', 'image/png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])],
    ['image', 'image/jpeg', Buffer.from([255, 216, 255, 0])],
    ['image', 'image/webp', Buffer.from('RIFF0000WEBP')],
    ['pdf', 'application/pdf', Buffer.from('%PDF-1.7')],
  ]) {
    assert.equal(validOriginalFile(kind, mime, ORIGINAL_FILE_LIMITS[kind]), true);
    assert.equal(validOriginalFile(kind, mime, ORIGINAL_FILE_LIMITS[kind] + 1), false);
    assert.equal(validOriginalFile(kind, mime, 0), false);
    assert.equal(matchesOriginalSignature(mime, bytes), true);
    assert.equal(matchesOriginalSignature(mime, Buffer.from('<script>private</script>')), false);
  }
  for (const mime of ['image/svg+xml', 'text/html', 'text/plain', 'audio/unknown']) assert.equal(validOriginalFile('image', mime, 10), false);
  const { originalRange } = f.load('@/lib/journey-originals-storage');
  for (const [input, expected] of [[undefined, undefined], ['bytes=0-4', 'bytes=0-4'], ['bytes=10-', 'bytes=10-24'], ['bytes=0-999', 'bytes=0-24'], ['bytes=-5', 'bytes=20-24'], ['bytes=-100', 'bytes=0-24']]) assert.equal(originalRange(input, 25), expected);
  for (const input of ['bytes=25-', 'bytes=4-1', 'bytes=-0', 'bytes=-', 'bytes=0-1,4-5', 'bytes=a-b', ['bytes=0-1'], 'bytes=999999999999999999999-']) assert.throws(() => originalRange(input, 25), error => error.status === 416);
});

test('create journals private by default and reject forged attribution, unknown entry IDs and malformed content', async () => {
  const f = fixture();
  const input = { requestId: randomUUID(), entryId: 20, kind: 'journal', label: ' First words ', journal_text: ' Private reflection ' };
  const created = await f.call('index', 1, { method: 'POST', body: input });
  assert.equal(created.statusCode, 201); assert.equal(created.body.original.is_shared, false);
  assert.equal(created.body.original.status, 'ready'); assert.equal(created.body.original.label, 'First words');
  assert.equal(f.rows.journey_originals[0].owner_id, 1); assert.equal(f.rows.journey_originals[0].journal_text, 'Private reflection');
  assertNoStorageLocation(created.body); assert.equal(f.events.some(event => event.storage), false);
  for (const [userId, body, headers, status] of [
    [null, input, {}, 401], [2, input, {}, 404],
    [1, { ...input, owner_id: 2 }, {}, 400], [1, { ...input, is_shared: true }, {}, 400],
    [1, { ...input, entryId: '20' }, {}, 400], [1, { ...input, entryId: 999 }, {}, 404],
    [1, { ...input, journal_text: ' ' }, {}, 400], [1, { ...input, journal_text: 'x'.repeat(50001) }, {}, 400],
    [1, { ...input, label: 'x'.repeat(121) }, {}, 400],
    [1, input, { origin: 'https://attacker.test' }, 403],
  ]) {
    const res = await f.call('index', userId, { method: 'POST', body, headers });
    assert.equal(res.statusCode, status); assert.equal(f.rows.journey_originals.length, 1);
  }
  const publicRead = await f.call('index', null, { query: { entryId: '20' } });
  assert.equal(publicRead.statusCode, 200); assert.equal(publicRead.body.originals.length, 0);
  const ownRead = await f.call('original', 1, { query: { id: '1' } });
  assert.equal(ownRead.statusCode, 200); assert.equal(ownRead.headers['cache-control'], 'private, no-store');
});

test('metadata handlers require explicit owner sharing and recheck profile, season and parent ownership on every request', async () => {
  const f = fixture({ journey_originals: [journal(1), audio(2, { status: 'pending', object_key: null })] });
  const other = await f.call('original', 2, { query: { id: '1' } }); assert.equal(other.statusCode, 404);
  const spoof = await f.call('original', 2, { method: 'PATCH', query: { id: '1' }, body: { is_shared: true, owner_id: 1 } }); assert.equal(spoof.statusCode, 404);
  const sharePending = await f.call('original', 1, { method: 'PATCH', query: { id: '2' }, body: { is_shared: true } }); assert.equal(sharePending.statusCode, 409);
  const shared = await f.call('original', 1, { method: 'PATCH', query: { id: '1' }, body: { is_shared: true, label: 'Shared memory' } });
  assert.equal(shared.statusCode, 200); assert.equal(shared.body.original.is_shared, true); assertNoStorageLocation(shared.body);
  for (const viewer of [null, 2]) assert.equal((await f.call('original', viewer, { query: { id: '1' } })).statusCode, 200);
  for (const [row, field] of [[f.rows.journey_profiles[0], 'is_public'], [f.rows.seasons[0], 'is_visible']]) {
    row[field] = false;
    for (const viewer of [null, 2]) {
      assert.equal((await f.call('original', viewer, { query: { id: '1' } })).statusCode, 404);
      assert.equal((await f.call('index', viewer, { query: { entryId: '20' } })).statusCode, 404);
    }
    assert.equal((await f.call('original', 1, { query: { id: '1' } })).statusCode, 200); row[field] = true;
  }
  await f.call('original', 1, { method: 'PATCH', query: { id: '1' }, body: { is_shared: false } });
  assert.equal((await f.call('original', 2, { query: { id: '1' } })).statusCode, 404);
  f.rows.seasons[0].user_id = 2;
  for (const viewer of [1, 2]) assert.equal((await f.call('original', viewer, { query: { id: '1' } })).statusCode, 404);
});

test('interrupted upload keeps a private reservation, retries only for the owner and finalizes idempotently after validating storage', async () => {
  const f = fixture();
  const body = { requestId: randomUUID(), entryId: 20, kind: 'audio', label: 'First recording', file_name: 'recording.mp3', mime_type: 'audio/mpeg', byte_size: 25 };
  const created = await f.call('index', 1, { method: 'POST', body });
  assert.equal(created.statusCode, 201); assert.equal(created.body.original.status, 'pending');
  assert.equal(created.body.original.is_shared, false); assert.equal(created.body.original.file_url, null);
  assertNoStorageLocation(created.body.original);
  const id = String(created.body.original.id); const pending = f.rows.journey_originals[0];
  assert.match(pending.upload_key, /^journey-originals\/pending\/1\//);
  assert.equal(created.body.upload.headers['Content-Type'], 'audio/mpeg'); assert.equal(created.body.upload.expires_in, 900);
  const signed = f.events.find(event => event.signed); assert.equal(signed.signed.ContentLength, 25); assert.equal(signed.config.expiresIn, 900);
  for (const route of ['retry', 'finalize']) {
    for (const viewer of [null, 2]) assert.equal((await f.call(route, viewer, { method: 'POST', query: { id } })).statusCode, viewer ? 404 : 401);
  }
  const missing = await f.call('finalize', 1, { method: 'POST', query: { id } });
  assert.equal(missing.statusCode, 400); assert.equal(f.rows.journey_originals[0].status, 'pending');
  const retry = await f.call('retry', 1, { method: 'POST', query: { id } });
  assert.equal(retry.statusCode, 200); assert.equal(f.rows.journey_originals.length, 1);
  f.put(pending.upload_key, { size: 24 });
  assert.equal((await f.call('finalize', 1, { method: 'POST', query: { id } })).statusCode, 400);
  assert.equal(f.rows.journey_originals[0].status, 'pending');
  f.put(pending.upload_key);
  const completed = await f.call('finalize', 1, { method: 'POST', query: { id } });
  assert.equal(completed.statusCode, 200); assert.equal(completed.body.original.status, 'ready'); assert.equal(completed.body.original.is_shared, false);
  assert.equal(completed.body.original.file_url, `/api/journeys/originals/${id}/file`); assertNoStorageLocation(completed.body);
  const record = f.rows.journey_originals[0]; assert.notEqual(record.object_key, record.upload_key);
  assert.equal(f.objects.has(record.upload_key), false); assert.equal(f.objects.has(record.object_key), true);
  const copies = f.events.filter(event => event.storage === 'CopyObjectCommand').length;
  assert.equal((await f.call('finalize', 1, { method: 'POST', query: { id } })).statusCode, 200);
  assert.equal(f.events.filter(event => event.storage === 'CopyObjectCommand').length, copies);
  assert.equal((await f.call('retry', 1, { method: 'POST', query: { id } })).statusCode, 409);
});

test('interrupted URL signing returns a discoverable pending original which can retry without creating duplicates', async () => {
  const options = { signingError: true }; const f = fixture({}, options);
  const created = await f.call('index', 1, { method: 'POST', body: { requestId: randomUUID(), entryId: 20, kind: 'pdf', label: 'Journal scan', file_name: 'scan.pdf', mime_type: 'application/pdf', byte_size: 8 } });
  assert.equal(created.statusCode, 201); assert.equal(created.body.original.status, 'pending');
  assert.equal(created.body.upload, undefined); assert.match(created.body.upload_error, /interrupted/i);
  assertNoStorageLocation(created.body);
  const list = await f.call('index', 1, { query: { entryId: '20' } });
  assert.equal(list.body.originals.length, 1); assert.equal(list.body.originals[0].id, created.body.original.id);
  options.signingError = false;
  const retry = await f.call('retry', 1, { method: 'POST', query: { id: String(created.body.original.id) } });
  assert.equal(retry.statusCode, 200); assert.ok(retry.body.upload); assert.equal(f.rows.journey_originals.length, 1);
});

test('lost creation responses replay the same owner request ID without duplicates or reverting later edits; conflicting intents are rejected', async () => {
  const f = fixture();
  const body = { requestId: randomUUID(), entryId: 20, kind: 'journal', label: 'First journal', journal_text: 'Initial private words' };
  const created = await f.call('index', 1, { method: 'POST', body });
  assert.equal(created.statusCode, 201);
  const replay = await f.call('index', 1, { method: 'POST', body });
  assert.equal(replay.statusCode, 201); assert.equal(replay.body.original.id, created.body.original.id);
  assert.equal(f.rows.journey_originals.length, 1); assertNoStorageLocation(replay.body);
  const changed = { label: 'Edited later', journal_text: 'Later private words', is_shared: true };
  await f.call('original', 1, { method: 'PATCH', query: { id: String(created.body.original.id) }, body: changed });
  const afterEdit = await f.call('index', 1, { method: 'POST', body });
  assert.equal(afterEdit.statusCode, 201); assert.equal(afterEdit.body.original.label, changed.label);
  assert.equal(afterEdit.body.original.journal_text, changed.journal_text); assert.equal(afterEdit.body.original.is_shared, true);
  for (const conflicting of [{ ...body, label: 'Another label' }, { ...body, journal_text: 'Another journal' }, { ...body, kind: 'audio', journal_text: undefined, file_name: 'song.mp3', mime_type: 'audio/mpeg', byte_size: 25 }]) {
    assert.equal((await f.call('index', 1, { method: 'POST', body: conflicting })).statusCode, 409);
    assert.equal(f.rows.journey_originals.length, 1);
  }
  for (const requestId of [undefined, 'not-a-uuid', ['invalid']]) assert.equal((await f.call('index', 1, { method: 'POST', body: { ...body, requestId } })).statusCode, 400);
  f.rows.seasons.push({ id: 12, user_id: 2, is_visible: true });
  f.rows.journey_profiles.push({ id: 6, user_id: 2, is_public: false });
  f.rows.journey_season_songs.push({ id: 22, season_id: 12, song_id: 30 });
  const other = await f.call('index', 2, { method: 'POST', body: { ...body, entryId: 22 } });
  assert.equal(other.statusCode, 201); assert.notEqual(other.body.original.id, created.body.original.id);
  assert.equal(f.rows.journey_originals.length, 2, 'Request IDs are scoped to the authenticated owner');
});

test('replaying a file create after completed upload returns its existing ready record without signing another upload', async () => {
  const f = fixture();
  const body = { requestId: randomUUID(), entryId: 20, kind: 'audio', label: 'First audio', file_name: 'audio.mp3', mime_type: 'audio/mpeg', byte_size: 25 };
  const created = await f.call('index', 1, { method: 'POST', body });
  assert.equal(created.statusCode, 201);
  f.put(f.rows.journey_originals[0].upload_key);
  const finalized = await f.call('finalize', 1, { method: 'POST', query: { id: String(created.body.original.id) } });
  assert.equal(finalized.statusCode, 200);
  const signed = f.events.filter(event => event.signed).length;
  const replay = await f.call('index', 1, { method: 'POST', body });
  assert.equal(replay.statusCode, 201); assert.equal(replay.body.original.id, created.body.original.id);
  assert.equal(replay.body.original.status, 'ready'); assert.equal(replay.body.upload, undefined);
  assert.equal(f.events.filter(event => event.signed).length, signed); assert.equal(f.rows.journey_originals.length, 1);
  assertNoStorageLocation(replay.body);
});

test('file reservations validate types and limits before storage, fail closed when unavailable and leave journals usable', async () => {
  const f = fixture();
  const base = { requestId: randomUUID(), entryId: 20, kind: 'image', label: 'Image', file_name: 'image.png', mime_type: 'image/png', byte_size: 100 };
  for (const body of [
    { ...base, mime_type: 'image/svg+xml' }, { ...base, mime_type: 'text/html' },
    { ...base, byte_size: 5 * 1024 * 1024 + 1 }, { ...base, byte_size: 0 },
    { ...base, file_name: '../private.png' }, { ...base, file_name: 'a\r\n.png' },
    { ...base, journal_text: 'Unexpected text' }, { ...base, object_key: 'forged' },
  ]) assert.equal((await f.call('index', 1, { method: 'POST', body })).statusCode, 400);
  assert.equal(f.events.length, 0); assert.equal(f.rows.journey_originals.length, 0);
  const blocked = fixture({}, { publicPolicy: true });
  assert.equal((await blocked.call('index', 1, { method: 'POST', body: base })).statusCode, 503);
  assert.equal(blocked.rows.journey_originals.length, 0);
  assert.equal((await blocked.call('index', 1, { method: 'POST', body: { requestId: randomUUID(), entryId: 20, kind: 'journal', label: 'Journal', journal_text: 'Available without files' } })).statusCode, 201);
  const list = await blocked.call('index', 1, { query: { entryId: '20' } });
  assert.equal(list.statusCode, 200); assert.equal(list.body.storage.enabled, false); assert.equal(list.body.originals.length, 1);
});

test('protected file handler denies unauthorized and hidden files before storage and supports bounded Range, HEAD and download responses', async () => {
  const f = fixture({ journey_originals: [audio(1), audio(2, { is_shared: true }), audio(3, { status: 'pending', object_key: null, is_shared: false })] });
  f.put(f.rows.journey_originals[0].object_key); f.put(f.rows.journey_originals[1].object_key);
  for (const [viewer, id, status] of [[null, '1', 404], [2, '1', 404], [1, '3', 404], [null, '999', 404], [1, ['1', '2'], 400]]) {
    const before = f.events.length; const denied = await f.call('file', viewer, { query: { id } });
    assert.equal(denied.statusCode, status); assert.equal(f.events.length, before, 'Denied requests must never ask storage for the object');
  }
  const own = await f.call('file', 1, { query: { id: '1' } });
  assert.equal(own.statusCode, 200); assert.equal(own.bytes().toString(), 'ID3private original audio');
  assert.match(own.headers['cache-control'], /no-store/); assert.equal(own.headers.vary, 'Cookie, Authorization');
  assert.equal(own.headers['x-content-type-options'], 'nosniff'); assert.match(own.headers['content-security-policy'], /sandbox/);
  assert.equal(own.headers['accept-ranges'], 'bytes'); assert.equal(own.headers['content-type'], 'audio/mpeg');
  assert.equal(own.headers.location, undefined);
  for (const viewer of [null, 2]) {
    const range = await f.call('file', viewer, { query: { id: '2' }, headers: { range: 'bytes=0-2' } });
    assert.equal(range.statusCode, 206); assert.equal(range.bytes().toString(), 'ID3'); assert.equal(range.headers['content-range'], 'bytes 0-2/25');
  }
  const suffix = await f.call('file', null, { query: { id: '2' }, headers: { range: 'bytes=-5' } });
  assert.equal(suffix.statusCode, 206); assert.equal(suffix.bytes().toString(), 'audio');
  const head = await f.call('file', 1, { method: 'HEAD', query: { id: '1', download: '1' } });
  assert.equal(head.statusCode, 200); assert.equal(head.bytes().length, 0); assert.equal(head.headers['content-length'], 25); assert.match(head.headers['content-disposition'], /^attachment;/);
  const headRange = await f.call('file', null, { method: 'HEAD', query: { id: '2' }, headers: { range: 'bytes=0-2' } });
  assert.equal(headRange.statusCode, 200); assert.equal(headRange.bytes().length, 0);
  assert.equal(headRange.headers['content-length'], 25); assert.equal(headRange.headers['content-range'], undefined);
  const headStorage = f.events.filter(event => event.storage === 'HeadObjectCommand').at(-1);
  assert.equal(headStorage.input.Range, undefined, 'HEAD ignores Range as required by HTTP semantics');
  const cookie = await f.call('file', null, { query: { id: '1' }, cookies: { token: token(1) } });
  assert.equal(cookie.statusCode, 200);
  for (const range of ['bytes=25-', 'bytes=0-2,4-8', 'bytes=-0']) {
    const before = f.events.filter(event => event.storage === 'GetObjectCommand').length;
    const invalid = await f.call('file', null, { query: { id: '2' }, headers: { range } });
    assert.equal(invalid.statusCode, 416); assert.equal(invalid.headers['content-range'], 'bytes */25');
    assert.equal(f.events.filter(event => event.storage === 'GetObjectCommand').length, before);
  }
  for (const [row, field] of [[f.rows.journey_profiles[0], 'is_public'], [f.rows.seasons[0], 'is_visible']]) {
    row[field] = false;
    const before = f.events.length;
    assert.equal((await f.call('file', 2, { query: { id: '2' } })).statusCode, 404); assert.equal(f.events.length, before);
    assert.equal((await f.call('file', 1, { query: { id: '2' } })).statusCode, 200); row[field] = true;
  }
  await f.call('original', 1, { method: 'PATCH', query: { id: '2' }, body: { is_shared: false } });
  assert.equal((await f.call('file', 2, { query: { id: '2' } })).statusCode, 404);
});

test('cancelled and removed originals and detached parent entries cannot deliver metadata, retry uploads or stream files', async () => {
  const f = fixture({ journey_originals: [audio(1, { is_shared: true }), audio(2, { status: 'pending', object_key: null })] });
  f.put(f.rows.journey_originals[0].object_key); f.put(f.rows.journey_originals[1].upload_key);
  assert.equal((await f.call('original', 2, { method: 'DELETE', query: { id: '1' } })).statusCode, 404);
  const deleted = await f.call('original', 1, { method: 'DELETE', query: { id: '1' } }); assert.equal(deleted.statusCode, 200);
  assert.equal((await f.call('original', 1, { method: 'DELETE', query: { id: '2' } })).statusCode, 200);
  assert.equal(f.objects.has('journey-originals/pending/1/2'), false);
  for (const id of ['1', '2']) for (const route of ['original', 'file', 'retry', 'finalize']) {
    const res = await f.call(route, 1, { method: ['retry', 'finalize'].includes(route) ? 'POST' : 'GET', query: { id } });
    assert.equal(res.statusCode, 404);
  }
  f.rows.journey_originals.push(audio(3, { is_shared: true })); f.rows.journey_season_songs = [];
  const before = f.events.length;
  for (const viewer of [1, 2, null]) assert.equal((await f.call('file', viewer, { query: { id: '3' } })).statusCode, 404);
  assert.equal(f.events.length, before);
});

test('reorder accepts the exact current owner collection and rejects duplicates, foreign IDs, omissions and invalid identifiers', async () => {
  const f = fixture({ journey_originals: [journal(1), journal(2), journal(3, { journey_entry_id: 999 })] });
  for (const ids of [[1, 1], [1], [1, 3], [1, 2, 3]]) {
    const res = await f.call('reorder', 1, { method: 'POST', body: { entryId: 20, originalIds: ids } });
    assert.equal(res.statusCode, 409); assert.equal(f.rows.journey_originals[0].display_order, 1);
  }
  assert.equal((await f.call('reorder', 2, { method: 'POST', body: { entryId: 20, originalIds: [2, 1] } })).statusCode, 404);
  for (const body of [{ entryId: 20, originalIds: ['1', 2] }, { entryId: [20], originalIds: [1, 2] }, { entryId: 20, originalIds: [-1, 2] }, { entryId: 20, originalIds: [1, 2], owner_id: 2 }]) assert.equal((await f.call('reorder', 1, { method: 'POST', body })).statusCode, 400);
  const reordered = await f.call('reorder', 1, { method: 'POST', body: { entryId: 20, originalIds: [2, 1] } });
  assert.equal(reordered.statusCode, 200); assert.deepEqual(Array.from(reordered.body.originals, row => row.id), [2, 1]);
  assert.deepEqual(Array.from(reordered.body.originals, row => row.display_order), [0, 1]); assertNoStorageLocation(reordered.body);
});

test('attachment limit rejects excess reservations and database failures never leak journal text to responses or logs', async () => {
  const body = { requestId: randomUUID(), entryId: 20, kind: 'journal', label: 'Private memory', journal_text: 'Confidential journal original' };
  const full = fixture({ journey_originals: Array.from({ length: 20 }, (_, index) => journal(index + 1)) });
  const exceeded = await full.call('index', 1, { method: 'POST', body });
  assert.equal(exceeded.statusCode, 409); assert.equal(full.rows.journey_originals.length, 20);
  const broken = fixture({}, { failInsertTable: 'journey_originals' });
  const failed = await broken.call('index', 1, { method: 'POST', body });
  assert.equal(failed.statusCode, 500); assert.equal(broken.rows.journey_originals.length, 0);
  assert.equal(JSON.stringify(failed.body).includes(body.journal_text), false);
  assert.equal(JSON.stringify(broken.errors).includes(body.journal_text), false);
});

test('journey read lazily projects authorized originals while preserving existing links, songs and reflections', async () => {
  const f = fixture({ journey_originals: [journal(1), journal(2, { is_shared: true }), audio(3, { is_shared: true })] });
  const other = await f.call('pages/api/journeys/[username].ts', 2, { query: { username: 'owner' } });
  assert.equal(other.statusCode, 200);
  const entry = other.body.seasons[0].songs[0];
  assert.deepEqual(Array.from(entry.originals, original => original.id), [2, 3]);
  assert.equal(entry.originals[0].journal_text, null, 'Bulk responses should fetch journal text only on explicit preview');
  assert.equal(entry.source_url, 'https://onedrive.example.test/original');
  assert.equal(entry.personal_note, 'Existing reflection'); assert.equal(entry.song.title, 'Finished song');
  assertNoStorageLocation(entry.originals);
  assert.match(other.headers['cache-control'], /no-store/);
  const own = await f.call('pages/api/journeys/[username].ts', 1, { query: { username: 'owner' } });
  assert.equal(own.statusCode, 200); assert.equal(own.body.seasons[0].songs[0].originals.length, 3);
  const detail = await f.call('original', 1, { query: { id: '1' } }); assert.equal(detail.body.original.journal_text, 'Private journal words');
  f.rows.journey_profiles[0].is_public = false;
  assert.equal((await f.call('pages/api/journeys/[username].ts', 2, { query: { username: 'owner' } })).statusCode, 403);
  assert.equal((await f.call('pages/api/journeys/[username].ts', 1, { query: { username: 'owner' } })).statusCode, 200);
});

test('exports omit originals until requested, apply public/private visibility and exclude pending uploads without exposing storage keys', async () => {
  const f = fixture({ journey_originals: [journal(1), journal(2, { is_shared: true, journal_text: 'Shared words' }), audio(3, { status: 'pending', object_key: null }), journal(4, { journey_entry_id: 21, is_shared: true, journal_text: 'Hidden season words' })] });
  f.rows.seasons.push({ id: 11, user_id: 1, title: 'Hidden season', is_visible: false, start_date: '2026-02-01', display_order: 1 });
  f.rows.journey_season_songs.push({ id: 21, season_id: 11, song_id: 31, display_order: 0, source_url: 'https://onedrive.example.test/hidden' });
  f.rows.songs.push({ id: 31, title: 'Hidden song', created_at: '2026-02-01' });
  const route = 'pages/api/journeys/export-for-llm.ts';
  for (const viewer of [null, 1, 2]) {
    const plain = await f.call(route, viewer, { query: { username: 'owner' } });
    assert.equal(plain.statusCode, 200); assert.equal(JSON.stringify(plain.body).includes('originals'), false);
  }
  const shared = await f.call(route, 2, { query: { username: 'owner', includeOriginals: 'true' } });
  assert.equal(shared.statusCode, 200); assert.equal(shared.body.journey.totalSeasons, 1);
  const song = shared.body.timeline.find(item => item.type === 'song');
  assert.equal(song.content.sourceUrl, 'https://onedrive.example.test/original');
  assert.deepEqual(Array.from(song.content.originals, original => original.id), [2]);
  assert.equal(song.content.originals[0].journal_text, 'Shared words'); assertNoStorageLocation(shared.body);
  const own = await f.call(route, 1, { query: { username: 'owner', includeOriginals: 'true' } });
  assert.equal(own.statusCode, 200); assert.equal(own.body.journey.totalSeasons, 2);
  const ownOriginals = own.body.timeline.filter(item => item.type === 'song').flatMap(item => item.content.originals);
  assert.deepEqual(Array.from(ownOriginals, original => original.id), [1, 2, 4]);
  assert.equal(ownOriginals.some(original => original.status === 'pending'), false); assertNoStorageLocation(own.body);
  assert.match(own.headers['cache-control'], /no-store/);
  for (const flag of ['1', ['true'], 'yes']) assert.equal((await f.call(route, 1, { query: { username: 'owner', includeOriginals: flag } })).statusCode, 400);
  await f.call('original', 1, { method: 'PATCH', query: { id: '2' }, body: { is_shared: false } });
  const revoked = await f.call(route, 2, { query: { username: 'owner', includeOriginals: 'true' } });
  assert.equal(revoked.body.timeline.find(item => item.type === 'song').content.originals.length, 0);
  f.rows.journey_profiles[0].is_public = false;
  for (const viewer of [null, 2]) assert.equal((await f.call(route, viewer, { query: { username: 'owner', includeOriginals: 'true' } })).statusCode, 403);
  assert.equal((await f.call(route, 1, { query: { username: 'owner', includeOriginals: 'true' } })).statusCode, 200);
});
