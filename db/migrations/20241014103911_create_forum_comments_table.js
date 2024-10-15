exports.up = function(knex) {
  return knex.schema.createTable('forum_comments', function(table) {
    table.increments('id').primary();
    table.text('content').notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.integer('topic_id').unsigned().notNullable();
    table.foreign('topic_id').references('forum_topics.id').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('forum_comments');
};