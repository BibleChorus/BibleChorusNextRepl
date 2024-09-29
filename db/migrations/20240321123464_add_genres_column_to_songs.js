exports.up = function(knex) {
  return knex.schema.alterTable('songs', function(table) {
    table.specificType('genres', 'text[]'); // Add the new genres column
  }).then(function() {
    // Migrate existing genre data into the new genres column
    return knex('songs').whereNotNull('genre').update({
      genres: knex.raw("string_to_array(genre, ', ')")
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('songs', function(table) {
    table.dropColumn('genres'); // Remove the genres column on rollback
  });
};