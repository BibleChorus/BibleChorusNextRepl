# Forum Topics Table

## Purpose
This table stores information about forum topics created by users, including metadata and relationships to users and songs.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the topic |
| title | string(255) | NOT NULL | | Title of the topic |
| content | text | NOT NULL | | Content of the topic |
| user_id | integer | NOT NULL, FOREIGN KEY | | ID of the user who created the topic |
| song_id | integer | FOREIGN KEY | NULL | ID of the associated song (if applicable) |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the topic was created |

## Constraints

- Foreign key on `user_id` referencing the `users` table with ON DELETE CASCADE
- Foreign key on `song_id` referencing the `songs` table with ON DELETE SET NULL

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| forum_topics_pkey | id | B-tree | Primary key index |
| idx_forum_topics_user_id | user_id | B-tree | For efficient queries by user |
| idx_forum_topics_song_id | song_id | B-tree | For efficient queries by associated song |
| idx_forum_topics_created_at | created_at | B-tree | For efficient sorting by creation date |

## Relationships

- Belongs to a user (`users` table)
- Optionally associated with a song (`songs` table)
- Has many comments (`forum_comments` table)

## Notes

- The `song_id` can be NULL, allowing for general discussion topics not related to a specific song.
- Consider adding a `views` column to track the popularity of topics.
- You might want to add a `last_activity` timestamp to easily sort topics by recent activity.

## Example Queries

1. Get all topics with user information:
   ```sql
   SELECT t.*, u.username 
   FROM forum_topics t
   JOIN users u ON t.user_id = u.id
   ORDER BY t.created_at DESC;
   ```

2. Get topics for a specific song:
   ```sql
   SELECT t.*, u.username 
   FROM forum_topics t
   JOIN users u ON t.user_id = u.id
   WHERE t.song_id = ?
   ORDER BY t.created_at DESC;
   ```

3. Get the most recent topics:
   ```sql
   SELECT t.*, u.username 
   FROM forum_topics t
   JOIN users u ON t.user_id = u.id
   ORDER BY t.created_at DESC
   LIMIT 10;
   ```

## Maintenance

- Regularly check for and remove spam topics.
- Consider implementing a soft delete mechanism for topics instead of hard deletes.
- Implement a mechanism to close or archive old or inactive topics.
