# Songs Table

## Purpose
This table stores information about individual songs, including metadata, lyrics, and details about AI involvement in creation.

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
| genre | string(50) | | | Genre of the song |
| lyrics_scripture_adherence | text | CHECK | 'close_paraphrase' | How closely the lyrics adhere to scripture |
| is_continuous_passage | boolean | | false | Indicates if the song uses a continuous scripture passage |
| lyrics | text | | | Full lyrics of the song |
| lyric_ai_prompt | text | | | AI prompt used for generating lyrics (if applicable) |
| music_ai_prompt | text | | | AI prompt used for generating music (if applicable) |
| music_model_used | string(50) | | | AI model used for music generation (if applicable) |
| song_art_url | string(255) | | | URL to the song's artwork |

## Constraints

- `lyrics_scripture_adherence` must be one of: 'word_for_word', 'close_paraphrase', 'creative_inspiration'

## Relationships

- `uploaded_by` references the `id` column in the `users` table
- Has a many-to-many relationship with `bible_verses` through the `song_verses` junction table

## Indexes

No specific indexes are defined in the provided migrations, but consider adding indexes on frequently queried columns like `title`, `artist`, and `genre`.

## Notes

- The `lyrics_scripture_adherence` column was updated from an ENUM to a TEXT type with a CHECK constraint.
- The default value for `lyrics_scripture_adherence` is 'close_paraphrase'.
- The table includes columns to track AI involvement in both lyrics and music creation.
- Consider adding a `views` or `play_count` column for tracking song popularity.
