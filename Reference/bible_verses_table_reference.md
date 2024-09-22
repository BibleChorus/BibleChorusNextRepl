# Bible Verses Table

## Purpose
This table stores individual Bible verses and maintains relationships with songs that reference these verses.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the verse |
| book | string(50) | NOT NULL | | Name of the book |
| chapter | integer | NOT NULL | | Chapter number |
| verse | integer | NOT NULL | | Verse number |
| KJV_text | text | NOT NULL | | King James Version text of the verse |
| all_song_ids | integer[] | | '{}' | Array of all song IDs associated with this verse |
| ai_lyrics_song_ids | integer[] | | '{}' | Array of song IDs with AI-generated lyrics |
| human_lyrics_song_ids | integer[] | | '{}' | Array of song IDs with human-written lyrics |
| ai_music_song_ids | integer[] | | '{}' | Array of song IDs with AI-generated music |
| human_music_song_ids | integer[] | | '{}' | Array of song IDs with human-composed music |
| continuous_passage_song_ids | integer[] | | '{}' | Array of song IDs using this verse as part of a continuous passage |
| non_continuous_passage_song_ids | integer[] | | '{}' | Array of song IDs using this verse not as part of a continuous passage |
| word_for_word_song_ids | integer[] | | '{}' | Array of song IDs with word-for-word lyrics from this verse |
| close_paraphrase_song_ids | integer[] | | '{}' | Array of song IDs with close paraphrase lyrics from this verse |
| creative_inspiration_song_ids | integer[] | | '{}' | Array of song IDs creatively inspired by this verse |
| genre_song_ids | jsonb | | '{}' | JSON object mapping genres to arrays of song IDs |
| translation_song_ids | jsonb | | '{}' | JSON object mapping translations to arrays of song IDs |

## Constraints

- Unique constraint on the combination of `book`, `chapter`, and `verse`

## Relationships

- Has a many-to-many relationship with `songs` through the `song_verses` junction table

## Indexes

| Index Name | Columns | Type |
|------------|---------|------|
| bible_verses_all_songs_idx | all_song_ids | GIN |
| bible_verses_ai_lyrics_idx | ai_lyrics_song_ids | GIN |
| bible_verses_human_lyrics_idx | human_lyrics_song_ids | GIN |
| bible_verses_ai_music_idx | ai_music_song_ids | GIN |
| bible_verses_human_music_idx | human_music_song_ids | GIN |
| bible_verses_continuous_passage_idx | continuous_passage_song_ids | GIN |
| bible_verses_non_continuous_passage_idx | non_continuous_passage_song_ids | GIN |
| bible_verses_word_for_word_idx | word_for_word_song_ids | GIN |
| bible_verses_close_paraphrase_idx | close_paraphrase_song_ids | GIN |
| bible_verses_creative_inspiration_idx | creative_inspiration_song_ids | GIN |
| bible_verses_genre_idx | genre_song_ids | GIN |
| bible_verses_translation_idx | translation_song_ids | GIN |

## Notes

- The table uses array columns to efficiently store relationships between verses and songs.
- GIN indexes are used for efficient querying of array and JSON columns.
- The `genre_song_ids` and `translation_song_ids` columns use JSONB type for flexible storage of genre and translation data.
- Consider adding a B-tree index on (`book`, `chapter`, `verse`) for faster lookups.
- The array and JSON columns allow for quick retrieval of related songs without additional joins, but may require periodic maintenance to keep in sync with the `song_verses` table.
