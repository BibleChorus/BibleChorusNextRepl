/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('journey_season_songs', function(table) {
    table.string('source_url', 2048);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('journey_season_songs', function(table) {
    table.dropColumn('source_url');
  });
};
