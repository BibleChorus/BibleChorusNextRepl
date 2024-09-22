# Song Verses Table

## Purpose
This table establishes a many-to-many relationship between songs and Bible verses, allowing each song to be associated with multiple verses and each verse to be associated with multiple songs.

## Columns and Types

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| song_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | ID of the song |
| verse_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | ID of the Bible verse |

## Primary Key
Composite primary key on (`song_id`, `verse_id`)

## Foreign Keys

| Column | References | On Delete |
|--------|------------|-----------|
| song_id | songs(id) | CASCADE |
| verse_id | bible_verses(id) | CASCADE |

## Indexes
The primary key columns (`song_id`, `verse_id`) are automatically indexed.

## Notes
- This is a junction table that resolves the many-to-many relationship between songs and Bible verses.
- The CASCADE delete rule ensures that if a song or verse is deleted, the corresponding entries in this table are also removed.
