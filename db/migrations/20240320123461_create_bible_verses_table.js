exports.up = function(knex) {
  return knex.schema.createTable('bible_verses', function(table) {
    table.increments('id').primary();
    table.string('book', 50).notNullable();
    table.integer('chapter').notNullable();
    table.integer('verse').notNullable();
    table.text('text').notNullable();
    table.unique(['book', 'chapter', 'verse']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bible_verses');
};