exports.up = function(knex) {
    return knex.schema.table('forum_topics', function(table) {
      table.integer('category_id').unsigned().references('id').inTable('forum_categories');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('forum_topics', function(table) {
      table.dropColumn('category_id');
    });
  };