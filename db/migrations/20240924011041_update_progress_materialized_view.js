/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    DROP MATERIALIZED VIEW IF EXISTS progress_materialized_view;
    
    CREATE MATERIALIZED VIEW progress_materialized_view AS
    WITH bible_info AS (
      SELECT
        book,
        CASE
          WHEN book IN ('Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi') THEN 'Old Testament'
          ELSE 'New Testament'
        END AS testament,
        verses AS total_verses
      FROM (VALUES
        ('Genesis', 1533),
        ('Exodus', 1213),
        ('Leviticus', 859),
        ('Numbers', 1288),
        ('Deuteronomy', 959),
        ('Joshua', 658),
        ('Judges', 618),
        ('Ruth', 85),
        ('1 Samuel', 810),
        ('2 Samuel', 695),
        ('1 Kings', 816),
        ('2 Kings', 719),
        ('1 Chronicles', 942),
        ('2 Chronicles', 822),
        ('Ezra', 280),
        ('Nehemiah', 406),
        ('Esther', 167),
        ('Job', 1070),
        ('Psalms', 2461),
        ('Proverbs', 915),
        ('Ecclesiastes', 222),
        ('Song of Solomon', 117),
        ('Isaiah', 1292),
        ('Jeremiah', 1364),
        ('Lamentations', 154),
        ('Ezekiel', 1273),
        ('Daniel', 357),
        ('Hosea', 197),
        ('Joel', 73),
        ('Amos', 146),
        ('Obadiah', 21),
        ('Jonah', 48),
        ('Micah', 105),
        ('Nahum', 47),
        ('Habakkuk', 56),
        ('Zephaniah', 53),
        ('Haggai', 38),
        ('Zechariah', 211),
        ('Malachi', 55),
        ('Matthew', 1071),
        ('Mark', 678),
        ('Luke', 1151),
        ('John', 879),
        ('Acts', 1007),
        ('Romans', 433),
        ('1 Corinthians', 437),
        ('2 Corinthians', 257),
        ('Galatians', 149),
        ('Ephesians', 155),
        ('Philippians', 104),
        ('Colossians', 95),
        ('1 Thessalonians', 89),
        ('2 Thessalonians', 47),
        ('1 Timothy', 113),
        ('2 Timothy', 83),
        ('Titus', 46),
        ('Philemon', 25),
        ('Hebrews', 303),
        ('James', 108),
        ('1 Peter', 105),
        ('2 Peter', 61),
        ('1 John', 105),
        ('2 John', 13),
        ('3 John', 14),
        ('Jude', 25),
        ('Revelation', 404)
      ) AS bbi(book, verses)
    )
    SELECT
      bi.book,
      bi.testament,
      bi.total_verses,
      COALESCE(ARRAY_LENGTH(bv.all_song_ids, 1), 0) AS verses_covered,
      COALESCE(ARRAY_LENGTH(bv.ai_lyrics_song_ids, 1), 0) AS ai_lyrics_verses,
      COALESCE(ARRAY_LENGTH(bv.human_lyrics_song_ids, 1), 0) AS human_lyrics_verses,
      COALESCE(ARRAY_LENGTH(bv.ai_music_song_ids, 1), 0) AS ai_music_verses,
      COALESCE(ARRAY_LENGTH(bv.human_music_song_ids, 1), 0) AS human_music_verses,
      COALESCE(ARRAY_LENGTH(bv.continuous_passage_song_ids, 1), 0) AS continuous_passage_verses,
      COALESCE(ARRAY_LENGTH(bv.non_continuous_passage_song_ids, 1), 0) AS non_continuous_passage_verses,
      COALESCE(ARRAY_LENGTH(bv.word_for_word_song_ids, 1), 0) AS word_for_word_verses,
      COALESCE(ARRAY_LENGTH(bv.close_paraphrase_song_ids, 1), 0) AS close_paraphrase_verses,
      COALESCE(ARRAY_LENGTH(bv.creative_inspiration_song_ids, 1), 0) AS creative_inspiration_verses,
      (COALESCE(ARRAY_LENGTH(bv.all_song_ids, 1), 0)::float / bi.total_verses) * 100 AS book_percentage,
      (COALESCE(ARRAY_LENGTH(bv.ai_lyrics_song_ids, 1), 0)::float / bi.total_verses) * 100 AS ai_lyrics_percentage,
      (COALESCE(ARRAY_LENGTH(bv.human_lyrics_song_ids, 1), 0)::float / bi.total_verses) * 100 AS human_lyrics_percentage,
      (COALESCE(ARRAY_LENGTH(bv.ai_music_song_ids, 1), 0)::float / bi.total_verses) * 100 AS ai_music_percentage,
      (COALESCE(ARRAY_LENGTH(bv.human_music_song_ids, 1), 0)::float / bi.total_verses) * 100 AS human_music_percentage,
      (COALESCE(ARRAY_LENGTH(bv.continuous_passage_song_ids, 1), 0)::float / bi.total_verses) * 100 AS continuous_passage_percentage,
      (COALESCE(ARRAY_LENGTH(bv.non_continuous_passage_song_ids, 1), 0)::float / bi.total_verses) * 100 AS non_continuous_passage_percentage,
      (COALESCE(ARRAY_LENGTH(bv.word_for_word_song_ids, 1), 0)::float / bi.total_verses) * 100 AS word_for_word_percentage,
      (COALESCE(ARRAY_LENGTH(bv.close_paraphrase_song_ids, 1), 0)::float / bi.total_verses) * 100 AS close_paraphrase_percentage,
      (COALESCE(ARRAY_LENGTH(bv.creative_inspiration_song_ids, 1), 0)::float / bi.total_verses) * 100 AS creative_inspiration_percentage
    FROM
      bible_info bi
    LEFT JOIN
      (SELECT 
        book,
        ARRAY_AGG(DISTINCT unnest(all_song_ids)) AS all_song_ids,
        ARRAY_AGG(DISTINCT unnest(ai_lyrics_song_ids)) AS ai_lyrics_song_ids,
        ARRAY_AGG(DISTINCT unnest(human_lyrics_song_ids)) AS human_lyrics_song_ids,
        ARRAY_AGG(DISTINCT unnest(ai_music_song_ids)) AS ai_music_song_ids,
        ARRAY_AGG(DISTINCT unnest(human_music_song_ids)) AS human_music_song_ids,
        ARRAY_AGG(DISTINCT unnest(continuous_passage_song_ids)) AS continuous_passage_song_ids,
        ARRAY_AGG(DISTINCT unnest(non_continuous_passage_song_ids)) AS non_continuous_passage_song_ids,
        ARRAY_AGG(DISTINCT unnest(word_for_word_song_ids)) AS word_for_word_song_ids,
        ARRAY_AGG(DISTINCT unnest(close_paraphrase_song_ids)) AS close_paraphrase_song_ids,
        ARRAY_AGG(DISTINCT unnest(creative_inspiration_song_ids)) AS creative_inspiration_song_ids
      FROM
        bible_verses
      GROUP BY
        book
      ) bv ON bi.book = bv.book;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw('DROP MATERIALIZED VIEW IF EXISTS progress_materialized_view');
};
