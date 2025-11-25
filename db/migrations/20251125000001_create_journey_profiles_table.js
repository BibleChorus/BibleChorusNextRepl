/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('journey_profiles', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).defaultTo('My Musical Journey');
    table.text('subtitle');
    table.text('bio');
    table.string('cover_image_url', 500);
    table.string('theme_color', 50).defaultTo('indigo');
    table.boolean('is_public').defaultTo(false);
    table.boolean('show_song_dates').defaultTo(true);
    table.boolean('show_play_counts').defaultTo(false);
    table.string('layout_style', 50).defaultTo('timeline');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('is_public');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('journey_profiles');
};
