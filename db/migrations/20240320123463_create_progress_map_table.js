exports.up = function(knex) {
  return knex.schema.createTable('progress_map', function(table) {
    table.increments('id').primary();
    table.string('book', 50).notNullable();
    table.integer('chapter').notNullable();
    table.integer('verse_count').notNullable();
    table.integer('song_count').notNullable();
    table.timestamp('last_updated', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['book', 'chapter']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('progress_map');
};