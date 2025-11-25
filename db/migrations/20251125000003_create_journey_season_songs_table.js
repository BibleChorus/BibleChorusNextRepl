/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('journey_season_songs', function(table) {
    table.increments('id').primary();
    table.integer('season_id').unsigned().notNullable()
      .references('id').inTable('seasons').onDelete('CASCADE');
    table.integer('song_id').unsigned().notNullable()
      .references('id').inTable('songs').onDelete('CASCADE');
    table.integer('display_order').unsigned().defaultTo(0);
    table.text('personal_note');
    table.string('significance', 100);
    table.date('added_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.unique(['season_id', 'song_id']);
    table.index('season_id');
    table.index('song_id');
    table.index('display_order');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('journey_season_songs');
};
