/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('progress_map', function(table) {
    // Convert JSON to JSONB
    table.jsonb('genre_verse_counts').alter();
    table.jsonb('translation_verse_counts').alter();

    // Add GIN indexes for efficient querying
    table.index('genre_verse_counts', 'idx_genre_verse_counts', 'GIN');
    table.index('translation_verse_counts', 'idx_translation_verse_counts', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('progress_map', function(table) {
    // Remove indexes
    table.dropIndex('genre_verse_counts', 'idx_genre_verse_counts');
    table.dropIndex('translation_verse_counts', 'idx_translation_verse_counts');

    // Convert JSONB back to JSON
    table.json('genre_verse_counts').alter();
    table.json('translation_verse_counts').alter();
  });
};
