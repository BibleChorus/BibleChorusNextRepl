exports.up = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.string('notebook_lm_url', 255);
    table.text('summary');
    table.string('source_url', 255);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.dropColumn('notebook_lm_url');
    table.dropColumn('summary');
    table.dropColumn('source_url');
  });
};
