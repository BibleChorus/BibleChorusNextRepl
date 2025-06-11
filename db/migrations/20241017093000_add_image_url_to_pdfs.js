exports.up = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.string('image_url', 255);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('pdfs', function(table) {
    table.dropColumn('image_url');
  });
};
