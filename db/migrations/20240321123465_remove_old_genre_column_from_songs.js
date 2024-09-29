exports.up = function(knex) {
  return knex.schema.table('songs', function(table) {
    table.dropColumn('genre');
  });
};

exports.down = function(knex) {
  return knex.schema.table('songs', function(table) {
    table.string('genre', 50);
  });
};