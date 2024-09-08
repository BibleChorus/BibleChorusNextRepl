exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email', 100).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // New columns
    table.string('profile_image_url', 255);
    table.boolean('is_admin').defaultTo(false);
    table.boolean('is_moderator').defaultTo(false);
    table.string('region', 100);
    table.enum('gender', ['male', 'female', 'other', 'prefer_not_to_say']).defaultTo('prefer_not_to_say');
    table.string('name', 255);
    
    // Additional useful columns
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('last_login').nullable();
    table.text('bio');
    table.string('website', 255);
    table.json('preferences');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};