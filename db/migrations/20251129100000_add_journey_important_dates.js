exports.up = function(knex) {
  return knex.schema.createTable('journey_season_important_dates', function(table) {
    table.increments('id').primary();
    table.integer('season_id').unsigned().notNullable()
      .references('id').inTable('seasons').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.date('event_date').notNullable();
    table.string('photo_url', 512).nullable();
    table.integer('display_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['season_id']);
    table.index(['event_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('journey_season_important_dates');
};
