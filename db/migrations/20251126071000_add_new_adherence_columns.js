exports.up = function(knex) {
  return knex.schema.alterTable('bible_verses', function(table) {
    table.specificType('somewhat_connected_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('no_connection_song_ids', 'integer[]').defaultTo('{}');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('bible_verses', function(table) {
    table.dropColumn('somewhat_connected_song_ids');
    table.dropColumn('no_connection_song_ids');
  });
};
