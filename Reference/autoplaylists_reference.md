# Autoplaylists Reference

## Overview
Autoplaylists are dynamically updated playlists based on specific criteria. This system uses PostgreSQL functions and triggers to automatically manage these playlists as songs are added, updated, or removed from the database.

## Key Components

### 1. song_matches_criteria Function

This function checks if a song matches the given criteria for an autoplaylist.

```sql
CREATE OR REPLACE FUNCTION public.song_matches_criteria(song_row songs, criteria jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
-- Function body (see full implementation in the original code)
$function$;
```

#### Supported Criteria:
- Genres (inclusion and exclusion)
- AI used for lyrics
- Music AI generated
- Bible translation used
- Lyrics scripture adherence
- Continuous passage
- Music model used
- Maximum play count
- Lyrics content (full-text search)
- Created after/before date
- AI music prompt content
- Bible books
- Song tags

### 2. Triggers

#### a. songs_after_update
Executes after a song is updated to adjust autoplaylists accordingly.

```sql
CREATE TRIGGER songs_after_update
AFTER UPDATE ON songs
FOR EACH ROW
EXECUTE FUNCTION update_auto_playlists_on_song_update();
```

#### b. songs_after_insert
Executes after a new song is inserted to add it to relevant autoplaylists.

```sql
CREATE TRIGGER songs_after_insert
AFTER INSERT ON songs
FOR EACH ROW
EXECUTE FUNCTION update_auto_playlists();
```

#### c. songs_after_delete
Executes after a song is deleted to remove it from autoplaylists.

```sql
CREATE TRIGGER songs_after_delete
AFTER DELETE ON songs
FOR EACH ROW
EXECUTE FUNCTION update_auto_playlists_on_song_delete();
```

### 3. Helper Functions

#### a. update_auto_playlists_on_song_update()
Updates autoplaylists when a song is modified.

#### b. update_auto_playlists()
Adds new songs to relevant autoplaylists.

#### c. update_auto_playlists_on_song_delete()
Removes deleted songs from autoplaylists.

## Predefined Autoplaylists

1. New Testament Songs
2. Old Testament Songs
3. Modern and World Music
4. Traditional and Acoustic Songs
5. Creative Scripture-Inspired Songs
6. Scripture-Adherent Songs
7. Individual Book Playlists (e.g., "Genesis Songs", "Exodus Songs", etc.)

## Usage

Autoplaylists are automatically maintained by the database triggers. When songs are added, updated, or deleted, the relevant autoplaylists are adjusted accordingly.

To create a new autoplaylist:

```sql
INSERT INTO playlists (name, user_id, is_public, is_auto, auto_criteria, description)
VALUES (
    'Playlist Name',
    NULL,
    true,
    true,
    '{"criteria": "value"}'::jsonb,
    'Description of the autoplaylist'
);
```

## Maintenance

- Regularly review the performance of the autoplaylist functions and triggers, especially as the number of songs and playlists grows.
- Consider implementing a job to periodically refresh all autoplaylists to ensure consistency.
- Monitor the complexity of autoplaylist criteria to avoid performance issues with very complex queries.

## Notes

- The `song_matches_criteria` function is central to the autoplaylist system and should be updated if new criteria types are added.
- Autoplaylists are public by default but can be made private by setting `is_public` to false.
- The `user_id` for autoplaylists is typically NULL as they are system-generated.
