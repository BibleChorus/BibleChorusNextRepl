# Likes Table

## Purpose
This table stores information about likes given by users to various entities in the system (e.g., songs, playlists, comments).

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the like |
| user_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | | ID of the user who liked the item |
| likeable_type | string | NOT NULL | | Type of the liked item (e.g., 'song', 'playlist', 'comment') |
| likeable_id | integer | NOT NULL, UNSIGNED | | ID of the liked item |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the like was created |

## Constraints

- Unique constraint on the combination of `user_id`, `likeable_type`, and `likeable_id`
- Foreign key on `user_id` referencing the `users` table with CASCADE on delete

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| likes_pkey | id | B-tree | Primary key index |
| likes_user_likeable_unique | (user_id, likeable_type, likeable_id) | B-tree | Unique constraint index |
| likes_likeable_idx | (likeable_type, likeable_id) | B-tree | For efficient queries on liked items |
| likes_created_at_idx | created_at | B-tree | For efficient sorting by creation time |

## Relationships

- Belongs to a user (`users` table)
- Polymorphic relationship with liked items (e.g., songs, playlists, comments)

## Notes

- The `likeable_type` and `likeable_id` columns allow for a polymorphic relationship, enabling likes on different types of entities.
- The unique constraint ensures that a user can only like an item once.
- The CASCADE delete rule on the `user_id` foreign key ensures that all likes are removed when a user is deleted.
- Consider adding additional indexes if specific query patterns emerge that require optimization.

## Example Queries

1. Get all likes for a specific item:
   ```sql
   SELECT * FROM likes
   WHERE likeable_type = ? AND likeable_id = ?;
   ```

2. Check if a user has liked an item:
   ```sql
   SELECT EXISTS (
     SELECT 1 FROM likes
     WHERE user_id = ? AND likeable_type = ? AND likeable_id = ?
   );
   ```

3. Get the number of likes for each song:
   ```sql
   SELECT likeable_id, COUNT(*) as like_count
   FROM likes
   WHERE likeable_type = 'song'
   GROUP BY likeable_id;
   ```

4. Get the most liked items of a specific type:
   ```sql
   SELECT likeable_id, COUNT(*) as like_count
   FROM likes
   WHERE likeable_type = ?
   GROUP BY likeable_id
   ORDER BY like_count DESC
   LIMIT 10;
   ```

## Maintenance

- Regularly check for orphaned likes (likes referencing non-existent items) and remove them if necessary.
- Consider implementing a cleanup process for likes on deleted items if not handled by application logic.
