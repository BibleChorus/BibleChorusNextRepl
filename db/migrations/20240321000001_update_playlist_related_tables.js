exports.up = function(knex) {
  return knex.schema
    .alterTable('playlists', function(table) {
      table.specificType('tags', 'text[]').defaultTo('{}');
      table.boolean('collaborative').defaultTo(false);
      table.integer('total_duration').defaultTo(0);
      table.timestamp('last_played_at', { useTz: true });
    })
    .alterTable('playlist_songs', function(table) {
      table.integer('added_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('added_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('last_played_at', { useTz: true });
    })
    .alterTable('user_playlist_library', function(table) {
      table.boolean('is_favorite').defaultTo(false);
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('playlists', function(table) {
      table.dropColumn('tags');
      table.dropColumn('collaborative');
      table.dropColumn('total_duration');
      table.dropColumn('last_played_at');
    })
    .alterTable('playlist_songs', function(table) {
      table.dropColumn('added_by');
      table.dropColumn('added_at');
      table.dropColumn('last_played_at');
    })
    .alterTable('user_playlist_library', function(table) {
      table.dropColumn('is_favorite');
    });
};