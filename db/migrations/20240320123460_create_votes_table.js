exports.up = function(knex) {
  return knex.schema.createTable('votes', function(table) {
    table.integer('user_id').unsigned().notNullable();
    table.integer('song_id').unsigned().notNullable();
    table.integer('vote_value').notNullable().checkIn([-1, 1]);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.primary(['user_id', 'song_id']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('song_id').references('id').inTable('songs').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('votes');
};