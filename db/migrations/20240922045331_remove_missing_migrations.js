/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex('knex_migrations')
    .whereIn('name', [
      '20240320123463_create_progress_map_table.js',
      '20240921044755_add_covered_verses_to_progress_map.js',
      '20240921061030_add_covered_verses_arrays_to_progress_map.js',
      '20240921061635_convert_json_to_jsonb.js'
    ])
    .del();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // This down migration is left empty intentionally.
  // Restoring deleted migration history could lead to inconsistencies.
  return Promise.resolve();
};
