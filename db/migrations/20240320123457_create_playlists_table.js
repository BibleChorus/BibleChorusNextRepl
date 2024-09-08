exports.up = function(knex) {
  return knex.schema.createTable('playlists', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.integer('user_id').unsigned();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_public').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('playlists');
};