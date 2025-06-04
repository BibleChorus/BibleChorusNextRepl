exports.up = function(knex) {
  return knex.schema.createTable('teachings', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.string('slug', 255).unique().notNullable();
    table.text('description');
    table.string('pdf_url', 255).notNullable();
    table.text('pdf_text');
    table.enum('based_on_type', ['theme', 'passage']).defaultTo('theme');
    table.string('reference', 255);
    table.boolean('ai_generated').defaultTo(false);
    table.text('ai_prompt');
    table.string('ai_model_used', 50);
    table.specificType('tags', 'text[]');
    table.string('language', 10).defaultTo('en');
    table.integer('uploaded_by').unsigned();
    table.foreign('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.integer('view_count').unsigned().defaultTo(0);
    table.integer('rating_total').unsigned().defaultTo(0);
    table.integer('rating_count').unsigned().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('teachings');
};
