exports.up = async function(knex) {
  // 1. Add verses_text column to songs table
  await knex.schema.alterTable('songs', function(table) {
    table.text('verses_text').nullable();
  });

  // 2. Function to update verses_text for a song
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_song_verses_text(p_song_id integer) RETURNS void AS $$
    DECLARE
      verses_text text;
    BEGIN
      SELECT string_agg(CONCAT(bv.book, ' ', bv.chapter, ':', bv.verse), ' ') INTO verses_text
      FROM song_verses sv
      JOIN bible_verses bv ON sv.verse_id = bv.id
      WHERE sv.song_id = p_song_id;

      UPDATE songs SET verses_text = verses_text WHERE id = p_song_id;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 3. Update songs_search_vector_trigger to include verses_text
  await knex.raw(`
    CREATE OR REPLACE FUNCTION songs_search_vector_trigger() RETURNS trigger AS $$
    begin
      new.search_vector :=
        setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.lyrics, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(new.lyric_ai_prompt, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(new.music_ai_prompt, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(new.genres, ' '), '')), 'D') ||
        setweight(to_tsvector('english', coalesce(new.verses_text, '')), 'D');
      return new;
    end
    $$ LANGUAGE plpgsql;
  `);

  // 4. Function to update search_vector when song_verses change
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_song_search_vector_on_song_verses_change() RETURNS trigger AS $$
    DECLARE
      song_id integer;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        song_id := OLD.song_id;
      ELSE
        song_id := NEW.song_id;
      END IF;

      PERFORM update_song_verses_text(song_id);

      -- Update the search_vector
      UPDATE songs SET search_vector =
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(lyrics, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(lyric_ai_prompt, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(music_ai_prompt, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(genres, ' '), '')), 'D') ||
        setweight(to_tsvector('english', coalesce(verses_text, '')), 'D')
      WHERE id = song_id;

      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 5. Create triggers on song_verses table
  await knex.raw(`
    CREATE TRIGGER song_verses_after_insert
    AFTER INSERT ON song_verses
    FOR EACH ROW EXECUTE PROCEDURE update_song_search_vector_on_song_verses_change();

    CREATE TRIGGER song_verses_after_update
    AFTER UPDATE ON song_verses
    FOR EACH ROW EXECUTE PROCEDURE update_song_search_vector_on_song_verses_change();

    CREATE TRIGGER song_verses_after_delete
    AFTER DELETE ON song_verses
    FOR EACH ROW EXECUTE PROCEDURE update_song_search_vector_on_song_verses_change();
  `);

  // 6. Update existing songs to populate verses_text
  await knex.raw(`
    UPDATE songs
    SET verses_text = subquery.verses_text
    FROM (
      SELECT sv.song_id, string_agg(CONCAT(bv.book, ' ', bv.chapter, ':', bv.verse), ' ') AS verses_text
      FROM song_verses sv
      JOIN bible_verses bv ON sv.verse_id = bv.id
      GROUP BY sv.song_id
    ) AS subquery
    WHERE songs.id = subquery.song_id;
  `);

  // 7. Refresh search_vector for all songs
  await knex.raw(`
    UPDATE songs SET search_vector =
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(lyrics, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(lyric_ai_prompt, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(music_ai_prompt, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(array_to_string(genres, ' '), '')), 'D') ||
      setweight(to_tsvector('english', coalesce(verses_text, '')), 'D');
  `);
};

exports.down = async function(knex) {
  // Drop triggers and functions
  await knex.raw(`
    DROP TRIGGER IF EXISTS song_verses_after_insert ON song_verses;
    DROP TRIGGER IF EXISTS song_verses_after_update ON song_verses;
    DROP TRIGGER IF EXISTS song_verses_after_delete ON song_verses;
    DROP FUNCTION IF EXISTS update_song_search_vector_on_song_verses_change;
    DROP FUNCTION IF EXISTS update_song_verses_text;
  `);

  // Remove verses_text column
  await knex.schema.alterTable('songs', function(table) {
    table.dropColumn('verses_text');
  });

  // Revert songs_search_vector_trigger to previous version
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
};