exports.up = function(knex) {
  return knex.schema.createTable('pdfs', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('author', 255);
    table.string('pdf_url', 255).notNullable();
    table.boolean('ai_assisted').defaultTo(false);
    table.specificType('themes', 'text[]');
    table.integer('uploaded_by').unsigned();
    table.foreign('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pdfs');
};
