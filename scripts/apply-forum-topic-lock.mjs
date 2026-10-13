import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const migrationName = '20261013000001_add_forum_topic_lock.js';
const migration = require(`../db/migrations/${migrationName}`);

/** Apply only the additive lock-column migration, never the historical chain. */
export async function applyForumTopicLock(db, { apply = false, expectedDatabase } = {}) {
  const metadata = await db.raw('SELECT current_database() AS database');
  const database = metadata.rows[0]?.database;
  if (!database) throw new Error('Unable to identify the database; no changes made');
  if (apply && (!expectedDatabase || expectedDatabase !== database)) {
    throw new Error('Expected database must match the connected database; no changes made');
  }
  if (!(await db.schema.hasTable('forum_topics'))) throw new Error('forum_topics is missing; no changes made');
  for (const column of ['id', 'user_id', 'title', 'content']) {
    if (!(await db.schema.hasColumn('forum_topics', column))) throw new Error(`Required forum_topics.${column} is missing; no changes made`);
  }
  const exists = await db.schema.hasColumn('forum_topics', 'is_locked');
  if (!apply || exists) return { database, migration: migrationName, isLockedPresent: exists, changed: false, mode: apply ? 'apply' : 'inspect' };

  await db.transaction(async trx => {
    // Concurrent runs of this targeted script serialize without touching rows.
    await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', ['biblechorus-forum-topic-lock']);
    await migration.up(trx);
    if (!(await trx.schema.hasColumn('forum_topics', 'is_locked'))) throw new Error('Column verification failed; transaction rolled back');
  });
  return { database, migration: migrationName, isLockedPresent: true, changed: true, mode: 'apply' };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Inspect: node scripts/apply-forum-topic-lock.mjs\nApply: node scripts/apply-forum-topic-lock.mjs --apply --expect-database <verified-name>');
    return;
  }
  let apply = false;
  let expectedDatabase;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--apply') apply = true;
    else if (args[index] === '--expect-database' && args[index + 1]) expectedDatabase = args[++index];
    else throw new Error(`Unknown or incomplete argument: ${args[index]}`);
  }
  const knex = (await import('knex')).default;
  const config = require('../knexfile.js');
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const db = knex(config[environment]);
  try {
    console.log(JSON.stringify(await applyForumTopicLock(db, { apply, expectedDatabase }), null, 2));
  } finally {
    await db.destroy();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
