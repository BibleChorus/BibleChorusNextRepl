/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('journey_profiles', function(table) {
      table.dropColumn('theme_color');
    })
    .alterTable('seasons', function(table) {
      table.dropColumn('theme_color');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('journey_profiles', function(table) {
      table.string('theme_color', 50).defaultTo('indigo');
    })
    .alterTable('seasons', function(table) {
      table.string('theme_color', 50);
    });
};
