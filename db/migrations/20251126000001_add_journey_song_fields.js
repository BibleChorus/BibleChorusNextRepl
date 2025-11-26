/**
 * Migration to add journey song fields to the songs table
 * - journey_date: Date the song relates to in user's Christian journey
 * - is_journey_song: Whether this is a journey song
 * - journey_song_origin: Where the song came from (prior_recording, journal_entry, dream, testimony, life_milestone, prophetic_word, other)
 * - music_origin: Replaces music_ai_generated boolean with text field (human, ai, ai_cover_of_human)
 * 
 * Note: lyrics_scripture_adherence is already a text field, so we just need to update validation
 * in the application code to accept new values: 'somewhat_connected' and 'no_connection'
 */

exports.up = async function(knex) {
  // Add new columns to songs table
  await knex.schema.alterTable('songs', (table) => {
    table.timestamp('journey_date').nullable();
    table.boolean('is_journey_song').defaultTo(false).notNullable();
    table.text('journey_song_origin').nullable();
    table.text('music_origin').defaultTo('human').notNullable();
  });

  // Migrate existing data: convert music_ai_generated boolean to music_origin text
  await knex.raw(`
    UPDATE songs 
    SET music_origin = CASE 
      WHEN music_ai_generated = true THEN 'ai'
      ELSE 'human'
    END;
  `);

  // Set all existing songs as NOT journey songs (they are scripture songs)
  await knex.raw(`
    UPDATE songs SET is_journey_song = false WHERE is_journey_song IS NULL;
  `);

  // Add indexes for faster filtering
  await knex.schema.alterTable('songs', (table) => {
    table.index('is_journey_song');
    table.index('journey_date');
    table.index('music_origin');
  });
};

exports.down = async function(knex) {
  // Remove indexes
  await knex.schema.alterTable('songs', (table) => {
    table.dropIndex('is_journey_song');
    table.dropIndex('journey_date');
    table.dropIndex('music_origin');
  });

  // Remove new columns
  await knex.schema.alterTable('songs', (table) => {
    table.dropColumn('journey_date');
    table.dropColumn('is_journey_song');
    table.dropColumn('journey_song_origin');
    table.dropColumn('music_origin');
  });
};
