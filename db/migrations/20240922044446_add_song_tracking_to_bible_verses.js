/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('bible_verses', function(table) {
    // Column for tracking all song IDs
    table.specificType('all_song_ids', 'integer[]').defaultTo('{}');

    // Arrays for tracking song IDs based on various criteria
    table.specificType('ai_lyrics_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('human_lyrics_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('ai_music_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('human_music_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('continuous_passage_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('non_continuous_passage_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('word_for_word_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('close_paraphrase_song_ids', 'integer[]').defaultTo('{}');
    table.specificType('creative_inspiration_song_ids', 'integer[]').defaultTo('{}');

    // JSON columns for genre and translation counts
    table.jsonb('genre_song_ids').defaultTo('{}');
    table.jsonb('translation_song_ids').defaultTo('{}');

    // Indexes for efficient querying
    table.index('all_song_ids', 'bible_verses_all_songs_idx', 'GIN');
    table.index('ai_lyrics_song_ids', 'bible_verses_ai_lyrics_idx', 'GIN');
    table.index('human_lyrics_song_ids', 'bible_verses_human_lyrics_idx', 'GIN');
    table.index('ai_music_song_ids', 'bible_verses_ai_music_idx', 'GIN');
    table.index('human_music_song_ids', 'bible_verses_human_music_idx', 'GIN');
    table.index('continuous_passage_song_ids', 'bible_verses_continuous_passage_idx', 'GIN');
    table.index('non_continuous_passage_song_ids', 'bible_verses_non_continuous_passage_idx', 'GIN');
    table.index('word_for_word_song_ids', 'bible_verses_word_for_word_idx', 'GIN');
    table.index('close_paraphrase_song_ids', 'bible_verses_close_paraphrase_idx', 'GIN');
    table.index('creative_inspiration_song_ids', 'bible_verses_creative_inspiration_idx', 'GIN');
    table.index('genre_song_ids', 'bible_verses_genre_idx', 'GIN');
    table.index('translation_song_ids', 'bible_verses_translation_idx', 'GIN');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('bible_verses', function(table) {
    // Remove indexes
    table.dropIndex('', 'bible_verses_all_songs_idx');
    table.dropIndex('', 'bible_verses_ai_lyrics_idx');
    table.dropIndex('', 'bible_verses_human_lyrics_idx');
    table.dropIndex('', 'bible_verses_ai_music_idx');
    table.dropIndex('', 'bible_verses_human_music_idx');
    table.dropIndex('', 'bible_verses_continuous_passage_idx');
    table.dropIndex('', 'bible_verses_non_continuous_passage_idx');
    table.dropIndex('', 'bible_verses_word_for_word_idx');
    table.dropIndex('', 'bible_verses_close_paraphrase_idx');
    table.dropIndex('', 'bible_verses_creative_inspiration_idx');
    table.dropIndex('', 'bible_verses_genre_idx');
    table.dropIndex('', 'bible_verses_translation_idx');

    // Remove columns
    table.dropColumn('all_song_ids');
    table.dropColumn('ai_lyrics_song_ids');
    table.dropColumn('human_lyrics_song_ids');
    table.dropColumn('ai_music_song_ids');
    table.dropColumn('human_music_song_ids');
    table.dropColumn('continuous_passage_song_ids');
    table.dropColumn('non_continuous_passage_song_ids');
    table.dropColumn('word_for_word_song_ids');
    table.dropColumn('close_paraphrase_song_ids');
    table.dropColumn('creative_inspiration_song_ids');
    table.dropColumn('genre_song_ids');
    table.dropColumn('translation_song_ids');
  });
};
