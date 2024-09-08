exports.up = function(knex) {
  return knex.schema.createTable('song_tags', function(table) {
    table.increments('id').primary();
    table.integer('song_id').unsigned().notNullable();
    table.foreign('song_id').references('id').inTable('songs').onDelete('CASCADE');
    table.string('tag', 50).notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.integer('created_by').unsigned();
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_approved').defaultTo(true);
    table.integer('usage_count').unsigned().defaultTo(1);
    table.unique(['song_id', 'tag']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('song_tags');
};