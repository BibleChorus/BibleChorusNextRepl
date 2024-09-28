CREATE MATERIALIZED VIEW progress_materialized_view AS
SELECT
  bv.book,
  COUNT(DISTINCT bv.verse_id) AS verses_covered,
  bbi.verses AS total_verses,
  (COUNT(DISTINCT bv.verse_id)::float / bbi.verses) * 100 AS percentage
FROM
  song_verses sv
JOIN
  bible_verses bv ON sv.verse_id = bv.id
JOIN
  (VALUES
    -- Insert verse counts per book from constants
    ('Genesis', 1533),
    ('Exodus', 1213),
    -- ... (Repeat for all books)
    ('Revelation', 404)
  ) AS bbi(book, verses) ON bv.book = bbi.book
GROUP BY
  bv.book, bbi.verses;