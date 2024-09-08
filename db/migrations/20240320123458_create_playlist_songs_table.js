exports.up = function(knex) {
  return knex.schema.createTable('playlist_songs', function(table) {
    table.integer('playlist_id').unsigned().notNullable();
    table.integer('song_id').unsigned().notNullable();
    table.integer('position').notNullable();
    table.primary(['playlist_id', 'song_id']);
    table.foreign('playlist_id').references('id').inTable('playlists').onDelete('CASCADE');
    table.foreign('song_id').references('id').inTable('songs').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('playlist_songs');
};