/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.raw('ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_lyrics_scripture_adherence_check')
    .then(() => {
      return knex.schema.raw(`
        ALTER TABLE songs
        ALTER COLUMN lyrics_scripture_adherence TYPE TEXT,
        ALTER COLUMN lyrics_scripture_adherence SET DEFAULT 'close_paraphrase'
      `);
    })
    .then(() => {
      return knex.schema.raw(`
        ALTER TABLE songs
        ADD CONSTRAINT songs_lyrics_scripture_adherence_check
        CHECK (lyrics_scripture_adherence IN ('word_for_word', 'close_paraphrase', 'creative_inspiration'))
      `);
    })
    .then(() => {
      // Update existing values
      return knex.raw(`
        UPDATE songs
        SET lyrics_scripture_adherence = CASE
          WHEN lyrics_scripture_adherence = 'The lyrics follow the scripture word-for-word' THEN 'word_for_word'
          WHEN lyrics_scripture_adherence = 'The lyrics closely follow the scripture passage' THEN 'close_paraphrase'
          WHEN lyrics_scripture_adherence = 'The lyrics are creatively inspired by the scripture passage' THEN 'creative_inspiration'
          ELSE 'close_paraphrase'
        END
      `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.raw('ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_lyrics_scripture_adherence_check')
    .then(() => {
      return knex.schema.raw(`
        ALTER TABLE songs
        ALTER COLUMN lyrics_scripture_adherence TYPE TEXT,
        ALTER COLUMN lyrics_scripture_adherence SET DEFAULT 'The lyrics closely follow the scripture passage'
      `);
    })
    .then(() => {
      return knex.schema.raw(`
        ALTER TABLE songs
        ADD CONSTRAINT songs_lyrics_scripture_adherence_check
        CHECK (lyrics_scripture_adherence IN ('The lyrics follow the scripture word-for-word', 'The lyrics closely follow the scripture passage', 'The lyrics are creatively inspired by the scripture passage'))
      `);
    })
    .then(() => {
      // Revert existing values
      return knex.raw(`
        UPDATE songs
        SET lyrics_scripture_adherence = CASE
          WHEN lyrics_scripture_adherence = 'word_for_word' THEN 'The lyrics follow the scripture word-for-word'
          WHEN lyrics_scripture_adherence = 'close_paraphrase' THEN 'The lyrics closely follow the scripture passage'
          WHEN lyrics_scripture_adherence = 'creative_inspiration' THEN 'The lyrics are creatively inspired by the scripture passage'
          ELSE 'The lyrics closely follow the scripture passage'
        END
      `);
    });
};
