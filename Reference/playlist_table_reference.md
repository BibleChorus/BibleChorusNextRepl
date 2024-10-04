# Playlists Table

## Purpose
This table stores information about user-created playlists, including metadata and relationships to users and songs.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the playlist |
| name | string(255) | NOT NULL | | Name of the playlist |
| user_id | integer | FOREIGN KEY (users.id) | | ID of the user who created the playlist |
| is_public | boolean | | false | Indicates if the playlist is public or private |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the playlist was created |
| cover_art_url | string(255) | | | URL to the playlist's cover art |
| description | text | | | Description of the playlist |
| last_updated | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the playlist was last updated |
| song_count | integer | UNSIGNED | 0 | Number of songs in the playlist |
| tags | text[] | | '{}' | Array of tags associated with the playlist |
| collaborative | boolean | | false | Indicates if the playlist allows collaboration |
| total_duration | integer | | 0 | Total duration of all songs in the playlist (in seconds) |
| last_played_at | timestamp with time zone | | null | Timestamp of when the playlist was last played |

## Constraints

- `user_id` references the `id` column in the `users` table with ON DELETE CASCADE

## Relationships

- Belongs to a user (`users` table) - the creator of the playlist
- Has many songs through the `playlist_songs` junction table
- Belongs to many users' libraries through the `user_playlist_library` junction table

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| idx_playlists_user_id | user_id | B-tree | For efficient queries by user |
| idx_playlists_created_at | created_at | B-tree | For sorting by creation date |
| idx_playlists_is_public | is_public | B-tree | For filtering public/private playlists |
| idx_playlists_last_updated | last_updated | B-tree | For efficient sorting by last update time |
| idx_playlists_last_played_at | last_played_at | B-tree | For efficient sorting by last played time |
| idx_playlists_total_duration | total_duration | B-tree | For efficient sorting and filtering by total duration |
| idx_playlists_song_count | song_count | B-tree | For efficient sorting and filtering by number of songs |
| idx_playlists_tags | tags | GIN | For efficient searching and filtering by tags |

## Notes

- The `song_count` column is a denormalized field for quick access to the number of songs in a playlist. It should be updated whenever songs are added or removed from the playlist.
- Consider adding a trigger to automatically update the `last_updated` timestamp whenever the playlist is modified.
- The `is_public` flag allows users to create both public and private playlists.
- The `cover_art_url` can be used to store a custom image for the playlist or a default image based on the playlist's content.
- The `tags` column allows for flexible categorization of playlists.
- The `collaborative` flag enables users to create playlists that can be edited by multiple users.
- `total_duration` provides a quick way to show the total length of the playlist.
- `last_played_at` can be used for sorting and displaying recently played playlists.

## Example Queries

1. Get all public playlists for a user:
   ```sql
   SELECT * FROM playlists
   WHERE user_id = ? AND is_public = true
   ORDER BY created_at DESC;
   ```

2. Get the most recently updated playlists:
   ```sql
   SELECT * FROM playlists
   ORDER BY last_updated DESC
   LIMIT 10;
   ```

3. Get playlists with the most songs:
   ```sql
   SELECT * FROM playlists
   ORDER BY song_count DESC
   LIMIT 5;
   ```

4. Get all playlists in a user's library:
   ```sql
   SELECT p.* FROM playlists p
   JOIN user_playlist_library upl ON p.id = upl.playlist_id
   WHERE upl.user_id = ?
   ORDER BY upl.added_at DESC;
   ```

5. Add a playlist to a user's library:
   ```sql
   INSERT INTO user_playlist_library (user_id, playlist_id)
   VALUES (?, ?)
   ON CONFLICT (user_id, playlist_id) DO NOTHING;
   ```

6. Remove a playlist from a user's library:
   ```sql
   DELETE FROM user_playlist_library
   WHERE user_id = ? AND playlist_id = ?;
   ```

7. Get playlists with specific tags:
   ```sql
   SELECT * FROM playlists
   WHERE tags && ARRAY['worship', 'contemporary']::text[];
   ```

8. Get collaborative playlists for a user:
   ```sql
   SELECT * FROM playlists
   WHERE user_id = ? AND collaborative = true;
   ```

## Maintenance

- Regularly check and update the `song_count` to ensure it matches the actual number of songs in each playlist.
- Consider implementing a cleanup process for playlists that have been empty for an extended period.
