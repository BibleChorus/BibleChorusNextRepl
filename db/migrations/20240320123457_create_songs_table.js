exports.up = function(knex) {
  return knex.schema.createTable('songs', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('artist', 255);
    table.string('file_path', 255).notNullable();
    table.integer('uploaded_by').unsigned();
    table.foreign('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('songs');
};