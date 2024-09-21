/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('progress_map', function(table) {
    // Add array fields for each type of verse count
    table.specificType('word_for_word_verses', 'INTEGER[]').defaultTo('{}');
    table.specificType('close_paraphrase_verses', 'INTEGER[]').defaultTo('{}');
    table.specificType('creative_inspiration_verses', 'INTEGER[]').defaultTo('{}');
    table.specificType('ai_lyrics_verses', 'INTEGER[]').defaultTo('{}');
    table.specificType('ai_music_verses', 'INTEGER[]').defaultTo('{}');
    table.specificType('human_created_verses', 'INTEGER[]').defaultTo('{}');
    table.specificType('continuous_passage_verses', 'INTEGER[]').defaultTo('{}');
    table.specificType('non_continuous_passage_verses', 'INTEGER[]').defaultTo('{}');

    // Add JSONB fields for genre and translation verse counts
    table.jsonb('genre_verses').defaultTo('{}');
    table.jsonb('translation_verses').defaultTo('{}');

    // Add indexes for faster querying
    table.index('word_for_word_verses', 'idx_word_for_word_verses', 'GIN');
    table.index('close_paraphrase_verses', 'idx_close_paraphrase_verses', 'GIN');
    table.index('creative_inspiration_verses', 'idx_creative_inspiration_verses', 'GIN');
    table.index('ai_lyrics_verses', 'idx_ai_lyrics_verses', 'GIN');
    table.index('ai_music_verses', 'idx_ai_music_verses', 'GIN');
    table.index('human_created_verses', 'idx_human_created_verses', 'GIN');
    table.index('continuous_passage_verses', 'idx_continuous_passage_verses', 'GIN');
    table.index('non_continuous_passage_verses', 'idx_non_continuous_passage_verses', 'GIN');

    // Add indexes for faster querying of JSONB fields
    table.index('genre_verses', 'idx_genre_verses', 'GIN');
    table.index('translation_verses', 'idx_translation_verses', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('progress_map', function(table) {
    // Remove the columns and indexes if we need to roll back
    table.dropIndex('word_for_word_verses', 'idx_word_for_word_verses');
    table.dropIndex('close_paraphrase_verses', 'idx_close_paraphrase_verses');
    table.dropIndex('creative_inspiration_verses', 'idx_creative_inspiration_verses');
    table.dropIndex('ai_lyrics_verses', 'idx_ai_lyrics_verses');
    table.dropIndex('ai_music_verses', 'idx_ai_music_verses');
    table.dropIndex('human_created_verses', 'idx_human_created_verses');
    table.dropIndex('continuous_passage_verses', 'idx_continuous_passage_verses');
    table.dropIndex('non_continuous_passage_verses', 'idx_non_continuous_passage_verses');

    // Remove the JSONB columns and indexes if we need to roll back
    table.dropIndex('genre_verses', 'idx_genre_verses');
    table.dropIndex('translation_verses', 'idx_translation_verses');

    table.dropColumn('word_for_word_verses');
    table.dropColumn('close_paraphrase_verses');
    table.dropColumn('creative_inspiration_verses');
    table.dropColumn('ai_lyrics_verses');
    table.dropColumn('ai_music_verses');
    table.dropColumn('human_created_verses');
    table.dropColumn('continuous_passage_verses');
    table.dropColumn('non_continuous_passage_verses');
    table.dropColumn('genre_verses');
    table.dropColumn('translation_verses');
  });
};
