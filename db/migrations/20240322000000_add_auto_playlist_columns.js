exports.up = function(knex) {
  return knex.schema.alterTable('playlists', function(table) {
    table.boolean('is_auto').defaultTo(false);
    table.jsonb('auto_criteria');
    
    // Add an index on is_auto for efficient querying
    table.index('is_auto');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('playlists', function(table) {
    table.dropColumn('is_auto');
    table.dropColumn('auto_criteria');
    
    // Drop the index
    table.dropIndex('', 'playlists_is_auto_index');
  });
};