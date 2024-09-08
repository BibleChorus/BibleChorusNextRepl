exports.up = function(knex) {
  return knex.schema.createTable('song_videos', function(table) {
    table.increments('id').primary();
    table.integer('song_id').unsigned().notNullable();
    table.foreign('song_id').references('id').inTable('songs').onDelete('CASCADE');
    table.integer('lyric_video_id').unsigned();
    table.foreign('lyric_video_id').references('id').inTable('lyric_videos').onDelete('SET NULL');
    table.integer('music_video_id').unsigned();
    table.foreign('music_video_id').references('id').inTable('music_videos').onDelete('SET NULL');
    table.unique(['song_id', 'lyric_video_id', 'music_video_id']);
    // New columns
    table.timestamp('release_date', { useTz: true });
    table.boolean('is_official').defaultTo(true);
    table.integer('view_count').unsigned().defaultTo(0);
    table.float('average_rating').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('song_videos');
};