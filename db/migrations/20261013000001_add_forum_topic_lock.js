// Additive and idempotent for installations whose live schema already has locking.
exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('forum_topics', 'is_locked'))) {
    await knex.schema.alterTable('forum_topics', table => {
      table.boolean('is_locked').notNullable().defaultTo(false);
    });
  }
};

// Keep existing moderation state and content intact on application rollback.
exports.down = async function() {};
