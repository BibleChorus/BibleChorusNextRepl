/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('journey_profiles', function(table) {
    table.string('notebook_lm_url', 500).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('journey_profiles', function(table) {
    table.dropColumn('notebook_lm_url');
  });
};
