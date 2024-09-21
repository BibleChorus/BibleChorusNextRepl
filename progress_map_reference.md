# Progress Map Table Reference

This document provides a reference for the fields available in the `progress_map` table, along with their data types.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | INTEGER | Primary key |
| book | VARCHAR(50) | Name of the Bible book |
| chapter | INTEGER | Chapter number |
| total_verses_in_chapter | INTEGER | Total number of verses in the chapter |
| total_verses_covered_count | INTEGER | Total number of verses covered |
| song_ids | INTEGER[] | Array of song IDs associated with this chapter |
| last_updated | TIMESTAMP WITH TIME ZONE | Last update timestamp |
| testament | VARCHAR(10) | 'Old' or 'New' |
| word_for_word_verse_count | INTEGER | Count of word-for-word verses |
| close_paraphrase_verse_count | INTEGER | Count of close paraphrase verses |
| creative_inspiration_verse_count | INTEGER | Count of creative inspiration verses |
| ai_lyrics_verse_count | INTEGER | Count of AI-generated lyrics verses |
| ai_music_verse_count | INTEGER | Count of AI-generated music verses |
| human_created_verse_count | INTEGER | Count of human-created verses |
| continuous_passage_verse_count | INTEGER | Count of continuous passage verses |
| non_continuous_passage_verse_count | INTEGER | Count of non-continuous passage verses |
| genre_verse_counts | JSONB | Counts of verses by genre |
| translation_verse_counts | JSONB | Counts of verses by translation |
| average_rating | FLOAT | Average rating of songs for this chapter |
| total_likes | INTEGER | Total likes for songs in this chapter |
| total_comments | INTEGER | Total comments for songs in this chapter |
| covered_verses | INTEGER[] | Array of covered verse numbers |
| word_for_word_verses | INTEGER[] | Array of word-for-word verse numbers |
| close_paraphrase_verses | INTEGER[] | Array of close paraphrase verse numbers |
| creative_inspiration_verses | INTEGER[] | Array of creative inspiration verse numbers |
| ai_lyrics_verses | INTEGER[] | Array of AI-generated lyrics verse numbers |
| ai_music_verses | INTEGER[] | Array of AI-generated music verse numbers |
| human_created_verses | INTEGER[] | Array of human-created verse numbers |
| continuous_passage_verses | INTEGER[] | Array of continuous passage verse numbers |
| non_continuous_passage_verses | INTEGER[] | Array of non-continuous passage verse numbers |
| genre_verses | JSONB | Verse numbers by genre |
| translation_verses | JSONB | Verse numbers by translation |

## Indexes

The following indexes are available for optimized querying:

- `testament`
- `book`
- `covered_verses` (GIN index)
- `word_for_word_verses` (GIN index)
- `close_paraphrase_verses` (GIN index)
- `creative_inspiration_verses` (GIN index)
- `ai_lyrics_verses` (GIN index)
- `ai_music_verses` (GIN index)
- `human_created_verses` (GIN index)
- `continuous_passage_verses` (GIN index)
- `non_continuous_passage_verses` (GIN index)
- `genre_verses` (GIN index)
- `translation_verses` (GIN index)
- `genre_verse_counts` (GIN index)
- `translation_verse_counts` (GIN index)

## Unique Constraints

- Unique constraint on `(book, chapter)`

Note: JSONB fields (`genre_verse_counts`, `translation_verse_counts`, `genre_verses`, `translation_verses`) allow for efficient querying of nested data structures.