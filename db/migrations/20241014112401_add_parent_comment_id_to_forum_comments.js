exports.up = function (knex) {
  return knex.schema.table('forum_comments', function (table) {
    table
      .integer('parent_comment_id')
      .unsigned()
      .references('id')
      .inTable('forum_comments')
      .onDelete('CASCADE');
  });
};

exports.down = function (knex) {
  return knex.schema.table('forum_comments', function (table) {
    table.dropColumn('parent_comment_id');
  });
};
