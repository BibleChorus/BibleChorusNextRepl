exports.up = function(knex) {
  return knex.schema.createTable('video_comments', function(table) {
    table.increments('id').primary();
    table.integer('song_video_id').unsigned().notNullable();
    table.foreign('song_video_id').references('id').inTable('song_videos').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('comment').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.integer('likes').unsigned().defaultTo(0);
    table.boolean('is_pinned').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('video_comments');
};