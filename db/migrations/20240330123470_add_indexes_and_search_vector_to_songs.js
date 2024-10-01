exports.up = async function(knex) {
  // Add the search_vector column for full-text search
  await knex.schema.alterTable('songs', function(table) {
    table.specificType('search_vector', 'tsvector').nullable();
  });

  // Populate search_vector for existing rows
  await knex.raw(`
    UPDATE songs SET search_vector = (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(lyrics, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(lyric_ai_prompt, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(music_ai_prompt, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(array_to_string(genres, ' '), '')), 'D')
    );
  `);

  // Create GIN index on search_vector for efficient full-text search
  await knex.raw(`
    CREATE INDEX idx_songs_search_vector ON songs USING GIN (search_vector);
  `);

  // Create trigger function to update search_vector on INSERT or UPDATE
  await knex.raw(`
    CREATE OR REPLACE FUNCTION songs_search_vector_trigger() RETURNS trigger AS $$
    begin
      new.search_vector :=
        setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.lyrics, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(new.lyric_ai_prompt, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(new.music_ai_prompt, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(new.genres, ' '), '')), 'D');
      return new;
    end
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger to execute the function
  await knex.raw(`
    CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON songs
    FOR EACH ROW EXECUTE PROCEDURE songs_search_vector_trigger();
  `);

  // Create indexes on columns used in filters
  await knex.raw(`
    CREATE INDEX idx_songs_lyrics_scripture_adherence ON songs (lyrics_scripture_adherence);
    CREATE INDEX idx_songs_is_continuous_passage ON songs (is_continuous_passage);
    CREATE INDEX idx_songs_music_ai_generated ON songs (music_ai_generated);
    CREATE INDEX idx_songs_ai_used_for_lyrics ON songs (ai_used_for_lyrics);
    CREATE INDEX idx_songs_music_model_used ON songs (music_model_used);
    CREATE INDEX idx_songs_bible_translation_used ON songs (bible_translation_used);
    CREATE INDEX idx_songs_title ON songs (title);
    CREATE INDEX idx_songs_artist ON songs (artist);
    CREATE INDEX idx_songs_uploaded_by ON songs (uploaded_by);
    -- For array column genres, create GIN index
    CREATE INDEX idx_songs_genres ON songs USING GIN (genres);
  `);
};

exports.down = async function(knex) {
  // Drop indexes and columns added in the up migration
  await knex.schema.alterTable('songs', function(table) {
    table.dropColumn('search_vector');
  });

  await knex.raw(`
    DROP INDEX IF EXISTS idx_songs_search_vector;
    DROP FUNCTION IF EXISTS songs_search_vector_trigger;
    DROP TRIGGER IF EXISTS tsvectorupdate ON songs;

    DROP INDEX IF EXISTS idx_songs_lyrics_scripture_adherence;
    DROP INDEX IF EXISTS idx_songs_is_continuous_passage;
    DROP INDEX IF EXISTS idx_songs_music_ai_generated;
    DROP INDEX IF EXISTS idx_songs_ai_used_for_lyrics;
    DROP INDEX IF EXISTS idx_songs_music_model_used;
    DROP INDEX IF EXISTS idx_songs_bible_translation_used;
    DROP INDEX IF EXISTS idx_songs_title;
    DROP INDEX IF EXISTS idx_songs_artist;
    DROP INDEX IF EXISTS idx_songs_uploaded_by;
    DROP INDEX IF EXISTS idx_songs_genres;
  `);
};