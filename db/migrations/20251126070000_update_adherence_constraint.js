exports.up = function(knex) {
  return knex.raw(`
    ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_lyrics_scripture_adherence_check;
    ALTER TABLE songs ADD CONSTRAINT songs_lyrics_scripture_adherence_check 
      CHECK (lyrics_scripture_adherence = ANY (ARRAY[
        'word_for_word'::text, 
        'close_paraphrase'::text, 
        'creative_inspiration'::text,
        'somewhat_connected'::text,
        'no_connection'::text
      ]));
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_lyrics_scripture_adherence_check;
    ALTER TABLE songs ADD CONSTRAINT songs_lyrics_scripture_adherence_check 
      CHECK (lyrics_scripture_adherence = ANY (ARRAY[
        'word_for_word'::text, 
        'close_paraphrase'::text, 
        'creative_inspiration'::text
      ]));
  `);
};
