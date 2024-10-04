exports.up = function(knex) {
  return knex.schema.alterTable('songs', function(table) {
    table.integer('duration').unsigned().defaultTo(0).comment('Duration of the song in seconds');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('songs', function(table) {
    table.dropColumn('duration');
  });
};