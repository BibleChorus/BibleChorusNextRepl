exports.up = function(knex) {
  return knex.schema.alterTable('songs', function(table) {
    table.integer('play_count').unsigned().defaultTo(0).comment('Number of times the song has been played');
    table.index('play_count');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('songs', function(table) {
    table.dropColumn('play_count');
  });
};