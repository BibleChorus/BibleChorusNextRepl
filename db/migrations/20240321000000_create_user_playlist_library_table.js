exports.up = function(knex) {
  return knex.schema.createTable('user_playlist_library', function(table) {
    table.integer('user_id').unsigned().notNullable();
    table.integer('playlist_id').unsigned().notNullable();
    table.timestamp('added_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.primary(['user_id', 'playlist_id']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('playlist_id').references('id').inTable('playlists').onDelete('CASCADE');
    
    // Index for faster queries
    table.index('added_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_playlist_library');
};