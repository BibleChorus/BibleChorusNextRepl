exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.string('password_hash').alter().nullable();
    table.string('auth_type').defaultTo('local');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.string('password_hash').alter().notNullable();
    table.dropColumn('auth_type');
  });
}; 