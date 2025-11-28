exports.up = function(knex) {
  return knex.schema.alterTable('journey_profiles', function(table) {
    table.integer('likes_count').unsigned().defaultTo(0).notNullable();
    table.index('likes_count');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('journey_profiles', function(table) {
    table.dropIndex('likes_count');
    table.dropColumn('likes_count');
  });
};
