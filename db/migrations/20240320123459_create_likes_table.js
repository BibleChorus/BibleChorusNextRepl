exports.up = function(knex) {
  return knex.schema.createTable('likes', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('likeable_type').notNullable();
    table.integer('likeable_id').unsigned().notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.unique(['user_id', 'likeable_type', 'likeable_id']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes for better query performance
    table.index(['likeable_type', 'likeable_id']);
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('likes');
};