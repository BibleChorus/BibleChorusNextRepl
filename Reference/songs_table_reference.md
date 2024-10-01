# Songs Table

## Purpose
This table stores information about individual songs, including metadata, lyrics, and details about AI involvement in creation. It also includes a search vector for efficient full-text search capabilities.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the song |
| title | string(255) | NOT NULL | | Title of the song |
| artist | string(255) | | | Artist of the song |
| audio_url | string(255) | NOT NULL | | URL to the audio file |
| uploaded_by | integer | FOREIGN KEY (users.id) | | ID of the user who uploaded the song |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the song was created |
| ai_used_for_lyrics | boolean | | false | Indicates if AI was used to generate lyrics |
| music_ai_generated | boolean | | false | Indicates if AI was used to generate music |
| bible_translation_used | string(10) | | | Bible translation used for the lyrics |
| genres | text[] | | | Array of genres associated with the song. Some genres may have a "/" character in them. |
| lyrics_scripture_adherence | text | CHECK | 'close_paraphrase' | How closely the lyrics adhere to scripture |
| is_continuous_passage | boolean | | false | Indicates if the song uses a continuous scripture passage |
| lyrics | text | | | Full lyrics of the song |
| lyric_ai_prompt | text | | | AI prompt used for generating lyrics (if applicable) |
| music_ai_prompt | text | | | AI prompt used for generating music (if applicable) |
| music_model_used | string(50) | | | AI model used for music generation (if applicable) |
| song_art_url | string(255) | | | URL to the song's artwork |
| search_vector | tsvector | | | Full-text search vector |
| verses_text | text | | | Concatenated text of associated Bible verses |

## Constraints

- `lyrics_scripture_adherence` must be one of: 'word_for_word', 'close_paraphrase', 'creative_inspiration'

## Relationships

- `uploaded_by` references the `id` column in the `users` table
- Has a many-to-many relationship with `bible_verses` through the `song_verses` junction table

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| idx_songs_search_vector | search_vector | GIN | For efficient full-text search |
| idx_songs_lyrics_scripture_adherence | lyrics_scripture_adherence | B-tree | For filtering by lyrics adherence |
| idx_songs_is_continuous_passage | is_continuous_passage | B-tree | For filtering by passage continuity |
| idx_songs_music_ai_generated | music_ai_generated | B-tree | For filtering by AI music generation |
| idx_songs_ai_used_for_lyrics | ai_used_for_lyrics | B-tree | For filtering by AI lyrics usage |
| idx_songs_music_model_used | music_model_used | B-tree | For filtering by music model |
| idx_songs_bible_translation_used | bible_translation_used | B-tree | For filtering by Bible translation |
| idx_songs_title | title | B-tree | For efficient title searches |
| idx_songs_artist | artist | B-tree | For efficient artist searches |
| idx_songs_uploaded_by | uploaded_by | B-tree | For efficient user uploads queries |
| idx_songs_genres | genres | GIN | For efficient genre filtering |

## Full-Text Search

The `search_vector` column is a tsvector that combines the following fields for full-text search:
- title (weight A)
- lyrics (weight B)
- lyric_ai_prompt (weight C)
- music_ai_prompt (weight C)
- genres (weight D)
- verses_text (weight D)

This allows for efficient searching across multiple fields with different priorities.

## Triggers

1. `tsvectorupdate`: Updates the `search_vector` column before INSERT or UPDATE operations.
2. `song_verses_after_insert`, `song_verses_after_update`, `song_verses_after_delete`: Update the `verses_text` and `search_vector` when associated Bible verses change.

## Notes

- The `lyrics_scripture_adherence` column uses a TEXT type with a CHECK constraint.
- The default value for `lyrics_scripture_adherence` is 'close_paraphrase'.
- The table includes columns to track AI involvement in both lyrics and music creation.
- The `genres` column is now an array of text, allowing for multiple genres per song.
- Consider adding a `views` or `play_count` column for tracking song popularity.
- The old `genre` column has been removed in favor of the new `genres` array column.
- The `search_vector` and associated triggers enable efficient full-text search across multiple fields.
- The `verses_text` column stores concatenated Bible verse references for improved searchability.
- Regular maintenance of the search vector and associated indexes may be required for optimal performance.

## Recent Changes

- Added `search_vector` column for full-text search capabilities.
- Added `verses_text` column to store concatenated Bible verse references.
- Created new indexes to support efficient filtering and searching.
- Implemented triggers to keep `search_vector` and `verses_text` updated.
- Removed the `genre` column (string type)
- Added the `genres` column (text[] type) to store multiple genres as an array
