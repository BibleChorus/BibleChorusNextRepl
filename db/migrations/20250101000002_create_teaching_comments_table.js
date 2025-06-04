exports.up = function(knex) {
  return knex.schema.createTable('teaching_comments', function(table) {
    table.increments('id').primary();
    table.integer('teaching_id').unsigned().notNullable();
    table.foreign('teaching_id').references('id').inTable('teachings').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('comment').notNullable();
    table.integer('parent_comment_id').unsigned();
    table.foreign('parent_comment_id').references('id').inTable('teaching_comments').onDelete('CASCADE');
    table.integer('likes').unsigned().defaultTo(0);
    table.boolean('is_edited').defaultTo(false);
    table.string('sentiment', 20);
    table.boolean('contains_scripture_reference').defaultTo(false);
    table.boolean('is_approved').defaultTo(true);
    table.boolean('is_pinned').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('teaching_comments');
};
