exports.up = function(knex) {
  return knex.schema.createTable('forum_categories', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.integer('parent_category_id').unsigned().nullable();
    table.foreign('parent_category_id').references('forum_categories.id').onDelete('SET NULL');
    
    // Add timestamps for created_at and updated_at
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('forum_categories');
};

// Comments:
// - This migration creates the 'forum_categories' table as specified in the reference.
// - The 'id' column is set as the primary key and will auto-increment.
// - 'name' is a required string field with a maximum length of 255 characters.
// - 'description' is an optional text field.
// - 'parent_category_id' is an optional foreign key referencing the same table,
//   allowing for the creation of subcategories.
// - We've added timestamps for better record-keeping.
// - The down function drops the table, allowing for easy rollback if needed.
