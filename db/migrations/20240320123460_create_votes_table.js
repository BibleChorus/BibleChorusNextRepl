exports.up = function(knex) {
  return knex.schema.createTable('votes', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('song_id').unsigned().notNullable();
    table.enum('vote_type', ['Best Musically', 'Best Lyrically', 'Best Overall']).notNullable();
    table.integer('vote_value').notNullable().checkIn([-1, 0, 1]);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'song_id', 'vote_type']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('song_id').references('id').inTable('songs').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('votes');
};