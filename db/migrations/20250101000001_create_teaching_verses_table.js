exports.up = function(knex) {
  return knex.schema.createTable('teaching_verses', function(table) {
    table.integer('teaching_id').unsigned().notNullable();
    table.integer('verse_id').unsigned().notNullable();
    table.primary(['teaching_id', 'verse_id']);
    table.foreign('teaching_id').references('id').inTable('teachings').onDelete('CASCADE');
    table.foreign('verse_id').references('id').inTable('bible_verses').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('teaching_verses');
};
