exports.up = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.dropColumn('source_url');
    table.dropIndex('uploaded_at', 'pdfs_uploaded_at_idx');
    table.dropColumn('uploaded_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.string('source_url', 255);
    table.timestamp('uploaded_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.schema.table('pdfs', function(table) {
    table.index('uploaded_at', 'pdfs_uploaded_at_idx');
  });
};
