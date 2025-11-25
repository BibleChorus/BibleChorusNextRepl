/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('seasons', function(table) {
    table.integer('year').unsigned();
    table.string('cover_image_url', 500);
    table.string('theme_color', 50);
    table.integer('display_order').unsigned().defaultTo(0);
    table.boolean('is_visible').defaultTo(true);
    table.text('reflection');
    table.string('scripture_reference', 255);
    
    table.index('year');
    table.index('display_order');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('seasons', function(table) {
    table.dropColumn('year');
    table.dropColumn('cover_image_url');
    table.dropColumn('theme_color');
    table.dropColumn('display_order');
    table.dropColumn('is_visible');
    table.dropColumn('reflection');
    table.dropColumn('scripture_reference');
  });
};
