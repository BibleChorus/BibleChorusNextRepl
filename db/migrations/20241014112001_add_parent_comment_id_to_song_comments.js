exports.up = function (knex) {
  return knex.schema.hasColumn('song_comments', 'parent_comment_id').then(exists => {
    if (!exists) {
      return knex.schema.table('song_comments', function (table) {
        table
          .integer('parent_comment_id')
          .unsigned()
          .references('id')
          .inTable('song_comments')
          .onDelete('CASCADE');
      });
    }
  });
};

exports.down = function (knex) {
  return knex.schema.hasColumn('song_comments', 'parent_comment_id').then(exists => {
    if (exists) {
      return knex.schema.table('song_comments', function (table) {
        table.dropColumn('parent_comment_id');
      });
    }
  });
};
