/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('progress_map', function(table) {
    // Add the covered_verses column as an array of integers
    table.specificType('covered_verses', 'INTEGER[]').defaultTo('{}');
    table.index('covered_verses', 'idx_covered_verses', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('progress_map', function(table) {
    // Remove the column if we need to roll back
    table.dropIndex('covered_verses', 'idx_covered_verses');
    table.dropColumn('covered_verses');
  });
};
