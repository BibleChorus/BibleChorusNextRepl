exports.up = function(knex) {
  return knex.schema.createTable('progress_map', function(table) {
    table.increments('id').primary();
    table.string('book', 50).notNullable();
    table.integer('chapter').notNullable();
    table.integer('verse_count').notNullable();
    table.specificType('song_ids', 'INTEGER[]').notNullable().defaultTo('{}');
    table.timestamp('last_updated', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['book', 'chapter']);

    // New columns for more detailed progress tracking
    table.string('testament', 10).notNullable(); // 'Old' or 'New'
    table.integer('word_for_word_verse_count').defaultTo(0);
    table.integer('close_paraphrase_verse_count').defaultTo(0);
    table.integer('creative_inspiration_verse_count').defaultTo(0);
    table.integer('ai_lyrics_verse_count').defaultTo(0);
    table.integer('ai_music_verse_count').defaultTo(0);
    table.integer('human_created_verse_count').defaultTo(0);
    table.integer('continuous_passage_verse_count').defaultTo(0);
    table.integer('non_continuous_passage_verse_count').defaultTo(0);

    // Counts for different genres
    table.json('genre_verse_counts'); // Store as JSON: { "Worship": 5, "Rock": 3, ... }

    // Counts for different translations used
    table.json('translation_verse_counts'); // Store as JSON: { "KJV": 10, "NIV": 5, ... }

    // Additional metrics
    table.float('average_rating').defaultTo(0);
    table.integer('total_likes').defaultTo(0);
    table.integer('total_comments').defaultTo(0);

    // Indexes for faster querying
    table.index('testament');
    table.index('book');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('progress_map');
};