exports.up = function(knex) {
  return knex.schema
    .alterTable('playlists', function(table) {
      table.index('last_updated');
      table.index('last_played_at');
      table.index('total_duration');
      table.index('song_count');
      table.index('tags', 'idx_playlists_tags', 'GIN');
    })
    .alterTable('playlist_songs', function(table) {
      table.index(['playlist_id', 'position']);
      table.index('added_at');
      table.index('last_played_at');
    })
    .alterTable('user_playlist_library', function(table) {
      table.index('is_favorite');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('playlists', function(table) {
      table.dropIndex('', 'idx_playlists_last_updated');
      table.dropIndex('', 'idx_playlists_last_played_at');
      table.dropIndex('', 'idx_playlists_total_duration');
      table.dropIndex('', 'idx_playlists_song_count');
      table.dropIndex('', 'idx_playlists_tags');
    })
    .alterTable('playlist_songs', function(table) {
      table.dropIndex('', 'playlist_songs_playlist_id_position_index');
      table.dropIndex('', 'idx_playlist_songs_added_at');
      table.dropIndex('', 'idx_playlist_songs_last_played_at');
    })
    .alterTable('user_playlist_library', function(table) {
      table.dropIndex('', 'idx_user_playlist_library_is_favorite');
    });
};