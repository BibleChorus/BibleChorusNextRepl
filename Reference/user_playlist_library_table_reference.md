# User Playlist Library Table

## Purpose
This table serves as a junction table to establish a many-to-many relationship between users and playlists, allowing users to add playlists to their personal library.

## Columns and Types

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| user_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | ID of the user |
| playlist_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | ID of the playlist |
| added_at | timestamp with time zone | DEFAULT CURRENT_TIMESTAMP | Timestamp when the playlist was added to the library |
| is_favorite | boolean | DEFAULT false | Indicates if the playlist is marked as a favorite |

## Primary Key
Composite primary key on (`user_id`, `playlist_id`)

## Foreign Keys

| Column | References | On Delete |
|--------|------------|-----------|
| user_id | users(id) | CASCADE |
| playlist_id | playlists(id) | CASCADE |

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| user_playlist_library_pkey | (user_id, playlist_id) | B-tree | Primary key (automatically created) |
| idx_user_playlist_library_added_at | added_at | B-tree | For efficient sorting by addition time |
| idx_user_playlist_library_is_favorite | is_favorite | B-tree | For efficient filtering of favorite playlists |

## Notes
- This table allows users to add any playlist to their library, including playlists created by other users.
- The CASCADE delete rule ensures that if a user or playlist is deleted, the corresponding entries in this table are also removed.
- The `is_favorite` flag allows users to mark certain playlists as favorites for quick access.

## Example Queries

1. Get all playlists in a user's library:
   ```sql
   SELECT p.* FROM playlists p
   JOIN user_playlist_library upl ON p.id = upl.playlist_id
   WHERE upl.user_id = ?
   ORDER BY upl.added_at DESC;
   ```

2. Add a playlist to a user's library:
   ```sql
   INSERT INTO user_playlist_library (user_id, playlist_id)
   VALUES (?, ?)
   ON CONFLICT (user_id, playlist_id) DO NOTHING;
   ```

3. Remove a playlist from a user's library:
   ```sql
   DELETE FROM user_playlist_library
   WHERE user_id = ? AND playlist_id = ?;
   ```

4. Check if a playlist is in a user's library:
   ```sql
   SELECT EXISTS (
     SELECT 1 FROM user_playlist_library
     WHERE user_id = ? AND playlist_id = ?
   ) as is_in_library;
   ```

5. Get a user's favorite playlists:
   ```sql
   SELECT p.* FROM playlists p
   JOIN user_playlist_library upl ON p.id = upl.playlist_id
   WHERE upl.user_id = ? AND upl.is_favorite = true
   ORDER BY upl.added_at DESC;
   ```

## Maintenance

- Regularly check for orphaned entries (e.g., entries referring to deleted playlists or users) and remove them if necessary.
- Consider implementing a limit on the number of playlists a user can add to their library, if needed.