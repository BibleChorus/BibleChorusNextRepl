const test = require('node:test');
const assert = require('node:assert/strict');

function fixture() {
  const calls = [];
  const columns = new Set(['id', 'user_id', 'title', 'content']);
  const db = {
    raw: async sql => { calls.push(sql); return { rows: [{ database: 'verified_biblechorus' }] }; },
    schema: {
      hasTable: async name => name === 'forum_topics',
      hasColumn: async (table, column) => table === 'forum_topics' && columns.has(column),
      alterTable: async (table, callback) => {
        assert.equal(table, 'forum_topics');
        const definition = { notNullable() { return definition; }, defaultTo(value) { assert.equal(value, false); return definition; } };
        callback({ boolean(column) { assert.equal(column, 'is_locked'); columns.add(column); calls.push(`ADD ${column}`); return definition; } });
      },
    },
    transaction: async callback => { calls.push('TRANSACTION'); return callback(db); },
  };
  return { db, calls, columns };
}

test('targeted lock inspection is read-only and requires the verified database before applying', async () => {
  const { applyForumTopicLock } = await import('../scripts/apply-forum-topic-lock.mjs');
  const f = fixture();
  const inspected = await applyForumTopicLock(f.db);
  assert.equal(inspected.changed, false); assert.equal(inspected.isLockedPresent, false);
  assert.equal(f.calls.includes('TRANSACTION'), false); assert.equal(f.columns.has('is_locked'), false);
  await assert.rejects(applyForumTopicLock(f.db, { apply: true }), /Expected database/);
  await assert.rejects(applyForumTopicLock(f.db, { apply: true, expectedDatabase: 'another_database' }), /Expected database/);
  assert.equal(f.columns.has('is_locked'), false);
});

test('targeted deployment invokes only the additive lock migration, preserves content columns, and is idempotent', async () => {
  const { applyForumTopicLock } = await import('../scripts/apply-forum-topic-lock.mjs');
  const f = fixture(); const before = [...f.columns];
  const applied = await applyForumTopicLock(f.db, { apply: true, expectedDatabase: 'verified_biblechorus' });
  assert.equal(applied.changed, true); assert.equal(applied.migration, '20261013000001_add_forum_topic_lock.js');
  assert.deepEqual([...f.columns], [...before, 'is_locked']);
  assert.equal(f.calls.filter(call => call === 'ADD is_locked').length, 1);
  const repeated = await applyForumTopicLock(f.db, { apply: true, expectedDatabase: 'verified_biblechorus' });
  assert.equal(repeated.changed, false); assert.equal(f.calls.filter(call => call === 'ADD is_locked').length, 1);
  assert.equal(f.calls.some(call => /UPDATE|DELETE|DROP|knex_migrations|migrate:latest/i.test(call)), false);
});
