exports.up = function(knex) {
  return knex.schema.createTable('song_verses', function(table) {
    table.integer('song_id').unsigned().notNullable();
    table.integer('verse_id').unsigned().notNullable();
    table.primary(['song_id', 'verse_id']);
    table.foreign('song_id').references('id').inTable('songs').onDelete('CASCADE');
    table.foreign('verse_id').references('id').inTable('bible_verses').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('song_verses');
};