const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fixture(options = {}) {
  const calls = [];
  const tables = new Map();
  const identity = { database: 'verified_biblechorus', schema: 'public' };
  for (const [name, columns] of Object.entries({
    users: { id: 'integer' },
    journey_profiles: { id: 'integer', user_id: 'integer', is_public: 'boolean' },
    seasons: { id: 'integer', user_id: 'integer', is_visible: 'boolean' },
    journey_season_songs: { id: 'integer', season_id: 'integer', song_id: 'integer', personal_note: 'text', source_url: 'character varying' },
  })) {
    tables.set(name, {
      columns: Object.entries(columns).map(([column_name, data_type]) => ({ column_name, data_type, is_nullable: 'NO' })),
      constraints: [{ type: 'p', validated: true, columns: ['id'] }],
      indexes: [], rows: [{ id: 42, marker: 'existing personal content' }],
    });
  }
  const db = {
    raw: async (sql, bindings = []) => {
      calls.push({ sql, bindings });
      if (sql.includes('current_database()')) return { rows: [identity] };
      if (sql.includes('pg_advisory_xact_lock')) {
        options.afterLock?.(tables);
        return { rows: [] };
      }
      const table = tables.get(bindings[0]);
      if (sql.includes('journey-originals:columns')) return { rows: table?.columns ?? [] };
      if (sql.includes('journey-originals:constraints')) return { rows: table?.constraints ?? [] };
      if (sql.includes('journey-originals:indexes')) return { rows: table?.indexes ?? [] };
      throw new Error(`Unexpected offline SQL: ${sql}`);
    },
    schema: {
      hasTable: async name => tables.has(name),
      createTable: async (name, callback) => {
        assert.equal(name, 'journey_originals', 'only the new table may be created');
        assert.equal(tables.has(name), false, 'must recheck after acquiring the lock');
        calls.push({ sql: `CREATE TABLE ${name}` });
        const table = { columns: [], constraints: [], indexes: [], rows: [] };
        tables.set(name, table);
        const addColumn = (column_name, data_type, character_maximum_length) => {
          const column = { column_name, data_type, character_maximum_length, is_nullable: 'YES', column_default: null };
          table.columns.push(column);
          let foreign;
          const definition = {
            primary() { column.is_nullable = 'NO'; table.constraints.push({ type: 'p', validated: true, columns: [column_name] }); return definition; },
            notNullable() { column.is_nullable = 'NO'; return definition; },
            defaultTo(value) { column.column_default = typeof value === 'string' ? `'${value}'::character varying` : String(value); return definition; },
            references(foreignColumn) { foreign = { type: 'f', validated: true, columns: [column_name], foreign_columns: [foreignColumn], foreign_schema: identity.schema }; return definition; },
            inTable(foreignTable) { foreign.foreign_table = foreignTable; return definition; },
            onDelete(action) { assert.equal(action, 'CASCADE'); foreign.delete_action = 'c'; table.constraints.push(foreign); return definition; },
          };
          return definition;
        };
        callback({
          increments(column) { const definition = addColumn(column, 'integer'); table.columns.at(-1).column_default = "nextval('journey_originals_id_seq'::regclass)"; return definition; },
          integer(column) { return addColumn(column, 'integer'); },
          uuid(column) { return addColumn(column, 'uuid'); },
          string(column, length) { return addColumn(column, 'character varying', length); },
          boolean(column) { return addColumn(column, 'boolean'); },
          text(column) { return addColumn(column, 'text'); },
          timestamps(useTimestamp, defaults) {
            assert.equal(useTimestamp, true); assert.equal(defaults, true);
            for (const column of ['created_at', 'updated_at']) {
              addColumn(column, 'timestamp with time zone').notNullable();
              table.columns.at(-1).column_default = 'CURRENT_TIMESTAMP';
            }
          },
          index(columns) { table.indexes.push({ valid: true, ready: true, full: true, columns: Array.isArray(columns) ? columns : [columns] }); },
          unique(columns) { table.constraints.push({ type: 'u', validated: true, columns: Array.isArray(columns) ? columns : [columns] }); },
          check(expression, bindings, constraintName) {
            assert.deepEqual(bindings, []);
            assert.ok(constraintName, 'privacy constraints must have stable names');
            table.constraints.push({ type: 'c', validated: true, name: constraintName, expression });
          },
        });
        options.afterCreate?.(table);
      },
    },
    transaction: async callback => {
      calls.push({ sql: 'TRANSACTION' });
      options.beforeTransaction?.(tables);
      const snapshot = structuredClone(tables);
      try { const result = await callback(db); calls.push({ sql: 'COMMIT' }); return result; }
      catch (error) { tables.clear(); for (const entry of snapshot) tables.set(...entry); calls.push({ sql: 'ROLLBACK' }); throw error; }
    },
  };
  return { db, tables, identity, calls };
}

async function apply(f) {
  const { applyJourneyOriginals } = await import('../scripts/apply-journey-originals.mjs');
  return applyJourneyOriginals(f.db, { apply: true, expectedDatabase: 'verified_biblechorus' });
}

test('originals inspection is read-only and reports a missing table without creating it', async () => {
  const { applyJourneyOriginals } = await import('../scripts/apply-journey-originals.mjs');
  const f = fixture(); const before = structuredClone(f.tables);
  const result = await applyJourneyOriginals(f.db);
  assert.deepEqual(result, {
    database: 'verified_biblechorus', schema: 'public', migration: '20261013000002_create_journey_originals.js',
    mode: 'inspect', changed: false, tablePresent: false, schemaValid: false, issues: ['journey_originals table is missing'],
  });
  assert.deepEqual(f.tables, before);
  assert.equal(f.calls.some(call => /TRANSACTION|pg_advisory|CREATE|UPDATE|DELETE|DROP|INSERT|knex_migrations/.test(call.sql)), false);
});

test('originals apply requires the exact verified database identity and explicit boolean mode', async () => {
  const { applyJourneyOriginals } = await import('../scripts/apply-journey-originals.mjs');
  const f = fixture();
  for (const expectedDatabase of [undefined, '', 'another_database', ' verified_biblechorus', 'VERIFIED_BIBLECHORUS']) {
    await assert.rejects(applyJourneyOriginals(f.db, { apply: true, expectedDatabase }), /Expected database/);
  }
  await assert.rejects(applyJourneyOriginals(f.db, { apply: 'true', expectedDatabase: 'verified_biblechorus' }), /explicitly true or false/);
  f.identity.schema = null;
  await assert.rejects(apply(f), /Unable to identify/);
  assert.equal(f.calls.some(call => call.sql === 'TRANSACTION'), false);
  assert.equal(f.tables.has('journey_originals'), false);
});

test('originals refuses missing ownership/privacy prerequisites and wrong referenced primary keys', async () => {
  for (const [table, column] of [['users', 'id'], ['journey_profiles', 'is_public'], ['seasons', 'user_id'], ['seasons', 'is_visible'], ['journey_season_songs', 'season_id'], ['journey_season_songs', 'source_url']]) {
    const f = fixture();
    f.tables.get(table).columns = f.tables.get(table).columns.filter(item => item.column_name !== column);
    await assert.rejects(apply(f), new RegExp(`${table}\\.${column} schema`));
    assert.equal(f.calls.some(call => call.sql === 'TRANSACTION'), false);
  }
  const missing = fixture(); missing.tables.delete('journey_profiles');
  await assert.rejects(apply(missing), /journey_profiles table is missing/);
  const primary = fixture(); primary.tables.get('journey_season_songs').constraints = [];
  await assert.rejects(apply(primary), /primary key is missing/);
});

test('originals applies only the additive migration, after the lock, preserving existing rows and migration history', async () => {
  const f = fixture(); const before = structuredClone(f.tables);
  const result = await apply(f);
  assert.equal(result.changed, true); assert.equal(result.schemaValid, true); assert.deepEqual(result.issues, []);
  assert.equal(result.migration, '20261013000002_create_journey_originals.js');
  for (const [table, data] of before) assert.deepEqual(f.tables.get(table), data);
  assert.equal(f.calls.filter(call => call.sql.startsWith('CREATE TABLE')).length, 1);
  assert.ok(f.calls.findIndex(call => call.sql.includes('pg_advisory_xact_lock')) < f.calls.findIndex(call => call.sql.startsWith('CREATE TABLE')));
  assert.equal(f.calls.some(call => /\b(UPDATE|DELETE|DROP|INSERT|knex_migrations)\b|migrate:latest/i.test(call.sql)), false);
  const repeated = await apply(f);
  assert.equal(repeated.changed, false); assert.equal(repeated.schemaValid, true);
  assert.equal(f.calls.filter(call => call.sql.startsWith('CREATE TABLE')).length, 1);
});

test('originals rechecks prerequisites under the advisory lock and creates nothing after a schema change', async () => {
  const f = fixture({ afterLock(tables) { tables.get('seasons').columns = tables.get('seasons').columns.filter(column => column.column_name !== 'is_visible'); } });
  await assert.rejects(apply(f), /seasons.is_visible schema/);
  assert.equal(f.tables.has('journey_originals'), false);
  assert.equal(f.calls.some(call => call.sql.startsWith('CREATE TABLE')), false);
  assert.ok(f.calls.some(call => call.sql === 'ROLLBACK'));
});

test('originals rechecks the transaction database and schema identity before creating anything', async () => {
  const f = fixture({ afterLock() { f.identity.database = 'unexpected_database'; } });
  await assert.rejects(apply(f), /database or schema changed.*transaction rolled back/);
  assert.equal(f.tables.has('journey_originals'), false);
  assert.equal(f.calls.some(call => call.sql.startsWith('CREATE TABLE')), false);
});

test('concurrent creation before lock acquisition is inspected without duplicating the table', async () => {
  const completed = fixture(); await apply(completed);
  const f = fixture({ beforeTransaction(tables) { tables.set('journey_originals', structuredClone(completed.tables.get('journey_originals'))); } });
  const result = await apply(f);
  assert.equal(result.changed, false); assert.equal(result.schemaValid, true);
  assert.equal(f.calls.some(call => call.sql.startsWith('CREATE TABLE')), false);
});

test('failed originals post-check rolls back the whole new table', async () => {
  const f = fixture({ afterCreate(table) { table.constraints = table.constraints.filter(item => item.name !== 'journey_originals_payload_check'); } });
  await assert.rejects(apply(f), /payload_check.*transaction rolled back/);
  assert.equal(f.tables.has('journey_originals'), false);
  assert.ok(f.calls.some(call => call.sql === 'ROLLBACK'));
});

test('an existing incomplete originals schema is reported read-only and refused without repair', async () => {
  const { applyJourneyOriginals } = await import('../scripts/apply-journey-originals.mjs');
  const corruptions = [
    table => { table.columns = table.columns.filter(column => column.column_name !== 'storage_bucket'); },
    table => { table.columns.find(column => column.column_name === 'is_shared').column_default = 'true'; },
    table => { table.columns.find(column => column.column_name === 'journal_text').is_nullable = 'NO'; },
    table => { table.columns.find(column => column.column_name === 'object_key').character_maximum_length = 255; },
    table => { table.constraints = table.constraints.filter(item => item.type !== 'u' || item.columns[0] !== 'upload_key'); },
    table => { table.constraints.find(item => item.type === 'f' && item.columns[0] === 'owner_id').delete_action = 'n'; },
    table => { table.constraints.find(item => item.name === 'journey_originals_sharing_check').validated = false; },
    table => { table.constraints.find(item => item.name === 'journey_originals_sharing_check').expression = "status = 'ready' OR is_shared = false OR true = true"; },
    table => { table.indexes.find(item => item.columns[0] === 'journey_entry_id').full = false; },
  ];
  for (const corrupt of corruptions) {
    const f = fixture(); await apply(f); corrupt(f.tables.get('journey_originals'));
    const before = structuredClone(f.tables); f.calls.length = 0;
    const result = await applyJourneyOriginals(f.db);
    assert.equal(result.schemaValid, false); assert.ok(result.issues.length > 0);
    assert.equal(f.calls.some(call => call.sql === 'TRANSACTION'), false);
    await assert.rejects(apply(f), /schema verification failed.*transaction rolled back/);
    assert.deepEqual(f.tables, before);
    assert.equal(f.calls.some(call => /CREATE TABLE|UPDATE|DELETE|DROP|INSERT|knex_migrations/.test(call.sql)), false);
  }
});

test('originals requires exact idempotency columns and owner/request uniqueness', async () => {
  const { applyJourneyOriginals } = await import('../scripts/apply-journey-originals.mjs');
  const completed = fixture(); await apply(completed);
  const original = completed.tables.get('journey_originals');
  assert.deepEqual(original.columns.find(column => column.column_name === 'request_id'), {
    column_name: 'request_id', data_type: 'uuid', character_maximum_length: undefined, is_nullable: 'NO', column_default: null,
  });
  assert.deepEqual(original.columns.find(column => column.column_name === 'request_digest'), {
    column_name: 'request_digest', data_type: 'character varying', character_maximum_length: 64, is_nullable: 'NO', column_default: null,
  });
  assert.ok(original.constraints.some(constraint => constraint.type === 'u' && JSON.stringify(constraint.columns) === JSON.stringify(['owner_id', 'request_id'])));
  const corruptions = [
    table => { table.columns = table.columns.filter(column => column.column_name !== 'request_id'); },
    table => { table.columns.find(column => column.column_name === 'request_id').data_type = 'text'; },
    table => { table.columns.find(column => column.column_name === 'request_id').column_default = 'gen_random_uuid()'; },
    table => { table.columns.find(column => column.column_name === 'request_digest').is_nullable = 'YES'; },
    table => { table.columns.find(column => column.column_name === 'request_digest').character_maximum_length = 32; },
    table => { table.columns.find(column => column.column_name === 'request_digest').column_default = "''::character varying"; },
    table => { table.constraints = table.constraints.filter(constraint => constraint.type !== 'u' || constraint.columns.length !== 2); },
    table => { table.constraints.find(constraint => constraint.type === 'u' && constraint.columns.length === 2).columns = ['request_id']; },
  ];
  for (const corrupt of corruptions) {
    const f = fixture(); f.tables.set('journey_originals', structuredClone(original));
    corrupt(f.tables.get('journey_originals')); const before = structuredClone(f.tables);
    const inspected = await applyJourneyOriginals(f.db);
    assert.equal(inspected.schemaValid, false);
    assert.ok(inspected.issues.some(issue => issue.includes('request_id') || issue.includes('request_digest')));
    await assert.rejects(apply(f), /schema verification failed/);
    assert.deepEqual(f.tables, before);
    assert.equal(f.calls.some(call => call.sql.startsWith('CREATE TABLE')), false);
  }
});

test('PostgreSQL casts and ANY rendering verify, while altered boolean grouping is rejected', async () => {
  const { applyJourneyOriginals } = await import('../scripts/apply-journey-originals.mjs');
  const f = fixture(); await apply(f);
  const constraints = f.tables.get('journey_originals').constraints;
  constraints.find(item => item.name === 'journey_originals_kind_check').expression = "((kind)::text = ANY ((ARRAY['audio'::character varying, 'journal'::character varying, 'image'::character varying, 'pdf'::character varying])::text[]))";
  constraints.find(item => item.name === 'journey_originals_sharing_check').expression = "(((status)::text = 'ready'::text) OR (is_shared = false))";
  assert.equal((await applyJourneyOriginals(f.db)).schemaValid, true);
  const payload = constraints.find(item => item.name === 'journey_originals_payload_check');
  payload.expression = payload.expression.replace("(status <> 'ready' OR object_key IS NOT NULL)", "status <> 'ready' OR object_key IS NOT NULL");
  const inspected = await applyJourneyOriginals(f.db);
  assert.equal(inspected.schemaValid, false);
  assert.ok(inspected.issues.some(issue => issue.includes('payload_check')));
});

test('cast-like or parenthesized text inside SQL literals cannot mask an altered check contract', async () => {
  const { applyJourneyOriginals } = await import('../scripts/apply-journey-originals.mjs');
  for (const altered of ["kind IN ('audio::text', 'journal', 'image', 'pdf')", "kind IN ('(audio)', 'journal', 'image', 'pdf')"]) {
    const f = fixture(); await apply(f);
    f.tables.get('journey_originals').constraints.find(item => item.name === 'journey_originals_kind_check').expression = altered;
    const inspected = await applyJourneyOriginals(f.db);
    assert.equal(inspected.schemaValid, false);
    assert.ok(inspected.issues.some(issue => issue.includes('kind_check')));
  }
});

test('CLI help and incomplete apply are offline and do not load a database connection', () => {
  const script = path.resolve(__dirname, '../scripts/apply-journey-originals.mjs');
  const env = { ...process.env, DATABASE_URL: '' };
  const help = spawnSync(process.execPath, [script, '--help'], { env, encoding: 'utf8' });
  assert.equal(help.status, 0); assert.match(help.stdout, /Inspect:/); assert.match(help.stdout, /historical migration chain/);
  for (const args of [['--apply'], ['--apply', '--expect-database'], ['--apply', '--expect-database', '--apply'], ['--apply', '--apply', '--expect-database', 'db']]) {
    const invalid = spawnSync(process.execPath, [script, ...args], { env, encoding: 'utf8' });
    assert.equal(invalid.status, 1); assert.doesNotMatch(invalid.stderr, /DATABASE_URL|password|connection refused/);
  }
});
