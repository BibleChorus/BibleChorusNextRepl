exports.up = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.timestamp('uploaded_at', { useTz: true }).defaultTo(knex.fn.now());
    table.index('uploaded_at', 'pdfs_uploaded_at_idx');
  });

  // Backfill existing rows using created_at if available
  await knex('pdfs').update({ uploaded_at: knex.raw('COALESCE(created_at, NOW())') });
};

exports.down = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.dropIndex('uploaded_at', 'pdfs_uploaded_at_idx');
    table.dropColumn('uploaded_at');
  });
};
