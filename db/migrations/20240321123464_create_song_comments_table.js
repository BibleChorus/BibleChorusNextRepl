exports.up = function(knex) {
  return knex.schema.createTable('song_comments', function(table) {
    table.increments('id').primary();
    table.integer('song_id').unsigned().notNullable();
    table.foreign('song_id').references('id').inTable('songs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('comment').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.integer('likes').unsigned().defaultTo(0);
    table.boolean('is_pinned').defaultTo(false);
    table.boolean('is_approved').defaultTo(true);
    table.integer('parent_comment_id').unsigned();
    table.foreign('parent_comment_id').references('id').inTable('song_comments').onDelete('SET NULL');
    table.boolean('is_edited').defaultTo(false);
    table.string('sentiment', 20);
    table.boolean('contains_scripture_reference').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('song_comments');
};