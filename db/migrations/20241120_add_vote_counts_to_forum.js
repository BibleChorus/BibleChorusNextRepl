exports.up = function(knex) {
  return knex.schema.table('forum_topics', function(table) {
    table.integer('upvotes').defaultTo(0).notNullable();
    table.integer('downvotes').defaultTo(0).notNullable();
    table.integer('score').defaultTo(0).notNullable(); // upvotes - downvotes
    table.index(['score']); // For sorting by popularity
  })
  .then(() => {
    return knex.schema.table('forum_comments', function(table) {
      table.integer('upvotes').defaultTo(0).notNullable();
      table.integer('downvotes').defaultTo(0).notNullable();
      table.integer('score').defaultTo(0).notNullable();
    });
  });
};

exports.down = function(knex) {
  return knex.schema.table('forum_topics', function(table) {
    table.dropColumn('upvotes');
    table.dropColumn('downvotes');
    table.dropColumn('score');
  })
  .then(() => {
    return knex.schema.table('forum_comments', function(table) {
      table.dropColumn('upvotes');
      table.dropColumn('downvotes');
      table.dropColumn('score');
    });
  });
};