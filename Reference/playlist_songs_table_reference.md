# Playlist Songs Table

## Purpose
This table serves as a junction table to establish a many-to-many relationship between playlists and songs, allowing each playlist to contain multiple songs and each song to be part of multiple playlists.

## Columns and Types

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| playlist_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | ID of the playlist |
| song_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | ID of the song |
| position | integer | NOT NULL | Position of the song within the playlist |
| added_by | integer | FOREIGN KEY (users.id) | ID of the user who added the song to the playlist |
| added_at | timestamp with time zone | DEFAULT CURRENT_TIMESTAMP | Timestamp when the song was added to the playlist |
| last_played_at | timestamp with time zone | | Timestamp when the song was last played in this playlist |

## Primary Key
Composite primary key on (`playlist_id`, `song_id`)

## Foreign Keys

| Column | References | On Delete |
|--------|------------|-----------|
| playlist_id | playlists(id) | CASCADE |
| song_id | songs(id) | CASCADE |
| added_by | users(id) | SET NULL |

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| playlist_songs_pkey | (playlist_id, song_id) | B-tree | Primary key (automatically created) |
| playlist_songs_playlist_id_position_index | (playlist_id, position) | B-tree | For efficient ordering of songs within a playlist |
| idx_playlist_songs_added_at | added_at | B-tree | For efficient sorting by addition time |
| idx_playlist_songs_last_played_at | last_played_at | B-tree | For efficient sorting by last played time |

## Notes
- This is a junction table that resolves the many-to-many relationship between playlists and songs.
- The `position` column allows for custom ordering of songs within a playlist.
- The `added_by` column allows tracking which user added each song, useful for collaborative playlists.
- `added_at` and `last_played_at` provide additional metadata for sorting and analysis.
- The CASCADE delete rule ensures that if a playlist or song is deleted, the corresponding entries in this table are also removed.

## Example Queries

1. Get all songs in a specific playlist, ordered by position:
   ```sql
   SELECT s.* FROM songs s
   JOIN playlist_songs ps ON s.id = ps.song_id
   WHERE ps.playlist_id = ?
   ORDER BY ps.position;
   ```

2. Count the number of playlists a song appears in:
   ```sql
   SELECT song_id, COUNT(*) as playlist_count
   FROM playlist_songs
   GROUP BY song_id;
   ```

3. Add a song to a playlist:
   ```sql
   INSERT INTO playlist_songs (playlist_id, song_id, position)
   VALUES (?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM playlist_songs WHERE playlist_id = ?));
   ```

4. Get recently added songs to a playlist:
   ```sql
   SELECT s.* FROM songs s
   JOIN playlist_songs ps ON s.id = ps.song_id
   WHERE ps.playlist_id = ?
   ORDER BY ps.added_at DESC
   LIMIT 10;
   ```

5. Get most played songs in a playlist:
   ```sql
   SELECT s.*, COUNT(*) as play_count FROM songs s
   JOIN playlist_songs ps ON s.id = ps.song_id
   WHERE ps.playlist_id = ? AND ps.last_played_at IS NOT NULL
   GROUP BY s.id
   ORDER BY play_count DESC
   LIMIT 5;
   ```

## Maintenance

- Ensure that the `position` values remain consistent when songs are added, removed, or reordered within a playlist.
- Consider implementing a trigger or application-level logic to update the `song_count` in the `playlists` table whenever a song is added to or removed from a playlist.