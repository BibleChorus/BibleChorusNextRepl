import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const migrationName = '20261013000002_create_journey_originals.js';
const migration = require(`../db/migrations/${migrationName}`);
const tableName = 'journey_originals';

const requiredTables = {
  users: { id: 'integer' },
  journey_profiles: { id: 'integer', user_id: 'integer', is_public: 'boolean' },
  seasons: { id: 'integer', user_id: 'integer', is_visible: 'boolean' },
  journey_season_songs: { id: 'integer', season_id: 'integer', song_id: 'integer', personal_note: 'text', source_url: 'character varying' },
};
const requiredColumns = {
  id: ['integer', false], journey_entry_id: ['integer', false], owner_id: ['integer', false],
  request_id: ['uuid', false], request_digest: ['character varying', false, 64],
  kind: ['character varying', false, 16], label: ['character varying', false, 120],
  display_order: ['integer', false], is_shared: ['boolean', false], status: ['character varying', false, 16],
  journal_text: ['text', true], file_name: ['character varying', true, 255], mime_type: ['character varying', true, 100],
  byte_size: ['integer', true], storage_bucket: ['character varying', true, 255],
  upload_key: ['character varying', true, 512], object_key: ['character varying', true, 512],
  created_at: ['timestamp with time zone', false], updated_at: ['timestamp with time zone', false],
};
const requiredChecks = {
  journey_originals_kind_check: "kind IN ('audio', 'journal', 'image', 'pdf')",
  journey_originals_status_check: "status IN ('pending', 'ready')",
  journey_originals_display_order_check: 'display_order >= 0',
  journey_originals_byte_size_check: 'byte_size IS NULL OR byte_size > 0',
  journey_originals_sharing_check: "status = 'ready' OR is_shared = false",
  journey_originals_payload_check: "(kind = 'journal' AND journal_text IS NOT NULL AND status = 'ready' AND storage_bucket IS NULL AND object_key IS NULL AND upload_key IS NULL) OR (kind <> 'journal' AND journal_text IS NULL AND storage_bucket IS NOT NULL AND upload_key IS NOT NULL AND mime_type IS NOT NULL AND byte_size IS NOT NULL AND (status <> 'ready' OR object_key IS NOT NULL))",
};

async function columnsFor(db, table) {
  const result = await db.raw(`/* journey-originals:columns */
    SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
    FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?`, [table]);
  return new Map(result.rows.map(column => [column.column_name, column]));
}

async function constraintsFor(db, table) {
  const result = await db.raw(`/* journey-originals:constraints */
    SELECT c.conname AS name, c.contype AS type, c.convalidated AS validated,
      pg_get_expr(c.conbin, c.conrelid) AS expression,
      ARRAY(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, key_order)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum ORDER BY k.key_order) AS columns,
      ft.relname AS foreign_table, fn.nspname AS foreign_schema, c.confdeltype AS delete_action,
      ARRAY(SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY AS k(attnum, key_order)
        JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum ORDER BY k.key_order) AS foreign_columns
    FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
    LEFT JOIN pg_class ft ON ft.oid = c.confrelid LEFT JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE n.nspname = current_schema() AND t.relname = ?`, [table]);
  return result.rows;
}

async function verifyPrerequisites(db) {
  for (const [table, requirements] of Object.entries(requiredTables)) {
    if (!(await db.schema.hasTable(table))) throw new Error(`Required ${table} table is missing; no changes made`);
    const columns = await columnsFor(db, table);
    for (const [name, type] of Object.entries(requirements)) {
      if (columns.get(name)?.data_type !== type) throw new Error(`Required ${table}.${name} schema is missing or incompatible; no changes made`);
    }
  }
  for (const table of ['users', 'journey_season_songs']) {
    const constraints = await constraintsFor(db, table);
    if (!constraints.some(constraint => constraint.type === 'p' && sameColumns(constraint.columns, ['id']))) {
      throw new Error(`Required ${table}.id primary key is missing; no changes made`);
    }
  }
}

function sameColumns(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

// Compare the known CHECK contracts structurally, retaining AND/OR grouping.
// PostgreSQL renders IN as = ANY(ARRAY[...]) and adds casts/parentheses.
function checkContract(expression) {
  const sql = expression.replace(/'(?:[^']|'')*'|::(?:character varying|text|integer|boolean)(?:\[\])?/gi, token => token.startsWith("'") ? token : '');
  const tokens = sql.match(/'(?:[^']|'')*'|[a-z_][a-z_0-9]*|>=|<>|[=><(),\[\]]|\d+/gi) ?? [];
  if (tokens.join('').replace(/\s/g, '') !== sql.replace(/\s/g, '')) throw new Error('Unsupported check expression');
  const input = tokens.map(token => token.startsWith("'") ? token : token.toLowerCase());
  for (let index = 0; index + 2 < input.length; index++) {
    if (input[index] === '(' && /^[a-z_][a-z_0-9]*$/.test(input[index + 1]) && input[index + 2] === ')') {
      input.splice(index, 3, input[index + 1]); index = Math.max(-1, index - 2);
    }
  }
  let position = 0;
  const take = token => { if (input[position] === token) { position++; return true; } return false; };
  const expect = token => { if (!take(token)) throw new Error('Unsupported check expression'); };
  function value() {
    if (take('(')) { const result = value(); expect(')'); return result; }
    if (take('array')) { expect('['); const values = []; do { values.push(value()); } while (take(',')); expect(']'); return values; }
    const result = input[position++];
    if (!result || ['and', 'or', '(', ')', ',', '[', ']'].includes(result)) throw new Error('Unsupported check expression');
    return result;
  }
  function predicate() {
    if (take('(')) { const result = or(); expect(')'); return result; }
    if (take('not')) return ['=', value(), 'false'];
    const left = value();
    if (take('is')) { const negated = take('not'); expect('null'); return [negated ? 'is not null' : 'is null', left]; }
    if (take('in')) { expect('('); const values = []; do { values.push(value()); } while (take(',')); expect(')'); return ['in', left, values]; }
    const operator = input[position++];
    if (!['=', '<>', '>', '>='].includes(operator)) throw new Error('Unsupported check expression');
    if (operator === '=' && take('any')) { expect('('); const values = value(); expect(')'); if (!Array.isArray(values)) throw new Error('Unsupported check expression'); return ['in', left, values]; }
    return [operator, left, value()];
  }
  function combine(operator, parts) {
    return parts.length === 1 ? parts[0] : [operator, ...parts.flatMap(part => part[0] === operator ? part.slice(1) : [part])];
  }
  function and() { const parts = [predicate()]; while (take('and')) parts.push(predicate()); return combine('and', parts); }
  function or() { const parts = [and()]; while (take('or')) parts.push(and()); return combine('or', parts); }
  const result = or();
  if (position !== input.length) throw new Error('Unsupported check expression');
  return JSON.stringify(result);
}

async function inspectOriginals(db, schema) {
  const present = await db.schema.hasTable(tableName);
  if (!present) return { tablePresent: false, schemaValid: false, issues: [`${tableName} table is missing`] };
  const columns = await columnsFor(db, tableName);
  const issues = [];
  for (const [name, [type, nullable, length]] of Object.entries(requiredColumns)) {
    const column = columns.get(name);
    if (!column || column.data_type !== type || column.is_nullable !== (nullable ? 'YES' : 'NO') || (length && column.character_maximum_length !== length)) {
      issues.push(`Incompatible or missing ${tableName}.${name}`);
    }
  }
  const defaults = { display_order: /^0$/, is_shared: /^false$/, status: /^'pending'(?:::character varying)?$/, id: /^nextval\(/, created_at: /^(CURRENT_TIMESTAMP|now\(\))$/i, updated_at: /^(CURRENT_TIMESTAMP|now\(\))$/i };
  for (const [column, expected] of Object.entries(defaults)) {
    if (!expected.test(columns.get(column)?.column_default ?? '')) issues.push(`Incompatible or missing ${tableName}.${column} default`);
  }
  for (const column of ['request_id', 'request_digest']) {
    if (columns.get(column)?.column_default != null) issues.push(`Unexpected ${tableName}.${column} default`);
  }
  const constraints = await constraintsFor(db, tableName);
  const hasConstraint = (type, names) => constraints.some(constraint => constraint.type === type && constraint.validated === true && sameColumns(constraint.columns, names));
  if (!hasConstraint('p', ['id'])) issues.push('Missing originals primary key');
  for (const names of [['object_key'], ['upload_key'], ['owner_id', 'request_id']]) {
    if (!hasConstraint('u', names)) issues.push(`Missing ${names.join(', ')} uniqueness constraint`);
  }
  for (const [column, foreignTable] of [['journey_entry_id', 'journey_season_songs'], ['owner_id', 'users']]) {
    if (!constraints.some(constraint => constraint.type === 'f' && constraint.validated === true && sameColumns(constraint.columns, [column]) && constraint.foreign_table === foreignTable && constraint.foreign_schema === schema && sameColumns(constraint.foreign_columns, ['id']) && constraint.delete_action === 'c')) {
      issues.push(`Missing ${column} foreign key with cascade`);
    }
  }
  for (const [name, expected] of Object.entries(requiredChecks)) {
    const constraint = constraints.find(item => item.name === name && item.type === 'c' && item.validated === true);
    try {
      if (!constraint || checkContract(constraint.expression) !== checkContract(expected)) issues.push(`Incompatible or missing ${name}`);
    } catch { issues.push(`Incompatible or missing ${name}`); }
  }
  const indexes = await db.raw(`/* journey-originals:indexes */
    SELECT i.indisvalid AS valid, i.indisready AS ready, i.indpred IS NULL AS full,
      ARRAY(SELECT a.attname FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, key_order)
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum ORDER BY k.key_order) AS columns
    FROM pg_index i JOIN pg_class t ON t.oid = i.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema() AND t.relname = ?`, [tableName]);
  for (const names of [['journey_entry_id', 'display_order'], ['owner_id']]) {
    if (!indexes.rows.some(index => index.valid === true && index.ready === true && index.full === true && sameColumns(index.columns, names))) issues.push(`Missing originals index on ${names.join(', ')}`);
  }
  return { tablePresent: true, schemaValid: issues.length === 0, issues };
}

/** Inspect by default. Apply only this additive migration after target verification. */
export async function applyJourneyOriginals(db, { apply = false, expectedDatabase } = {}) {
  if (typeof apply !== 'boolean') throw new Error('Apply must be explicitly true or false; no changes made');
  const metadata = await db.raw('SELECT current_database() AS database, current_schema() AS schema');
  const { database, schema } = metadata.rows[0] ?? {};
  if (!database || !schema) throw new Error('Unable to identify the database and schema; no changes made');
  if (apply && (!expectedDatabase || expectedDatabase !== database)) throw new Error('Expected database must match the connected database exactly; no changes made');
  await verifyPrerequisites(db);
  if (!apply) return { database, schema, migration: migrationName, mode: 'inspect', changed: false, ...await inspectOriginals(db, schema) };

  let changed = false;
  let inspected;
  await db.transaction(async trx => {
    await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', ['biblechorus-journey-originals']);
    const target = await trx.raw('SELECT current_database() AS database, current_schema() AS schema');
    if (target.rows[0]?.database !== database || target.rows[0]?.schema !== schema) throw new Error('Connected database or schema changed; transaction rolled back');
    await verifyPrerequisites(trx);
    inspected = await inspectOriginals(trx, schema);
    if (!inspected.tablePresent) {
      await migration.up(trx);
      changed = true;
      inspected = await inspectOriginals(trx, schema);
    }
    if (!inspected.schemaValid) throw new Error(`Journey Originals schema verification failed: ${inspected.issues.join('; ')}; transaction rolled back`);
  });
  return { database, schema, migration: migrationName, mode: 'apply', changed, ...inspected };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Inspect: node scripts/apply-journey-originals.mjs\nApply: node scripts/apply-journey-originals.mjs --apply --expect-database <verified-name>\nApplies only the Journey Originals migration; never the historical migration chain.');
    return;
  }
  let apply = false;
  let expectedDatabase;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--apply' && !apply) apply = true;
    else if (args[index] === '--expect-database' && !expectedDatabase && args[index + 1] && !args[index + 1].startsWith('--')) expectedDatabase = args[++index];
    else throw new Error(`Unknown, duplicate, or incomplete argument: ${args[index]}`);
  }
  // Reject incomplete mutation requests before loading configuration or opening a pool.
  if (apply && !expectedDatabase) throw new Error('--apply requires --expect-database <verified-name>; no changes made');
  const knex = (await import('knex')).default;
  const config = require('../knexfile.js');
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const db = knex(config[environment]);
  try { console.log(JSON.stringify(await applyJourneyOriginals(db, { apply, expectedDatabase }), null, 2)); }
  finally { await db.destroy(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
