exports.up = function(knex) {
  return knex.schema.table('user_playlist_library', function(table) {
    table.boolean('is_creator').notNullable().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('user_playlist_library', function(table) {
    table.dropColumn('is_creator');
  });
};