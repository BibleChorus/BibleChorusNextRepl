exports.up = function(knex) {
  return knex.schema.createTable('video_tags', function(table) {
    table.increments('id').primary();
    table.integer('song_video_id').unsigned().notNullable();
    table.foreign('song_video_id').references('id').inTable('song_videos').onDelete('CASCADE');
    table.string('tag', 50).notNullable();
    table.unique(['song_video_id', 'tag']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('video_tags');
};