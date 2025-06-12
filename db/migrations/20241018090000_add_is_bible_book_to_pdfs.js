exports.up = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.boolean('is_bible_book').notNullable().defaultTo(false);
    table.index('is_bible_book', 'pdfs_is_bible_book_idx');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.dropIndex('is_bible_book', 'pdfs_is_bible_book_idx');
    table.dropColumn('is_bible_book');
  });
};
