# Forum Comments Table

## Purpose
This table stores comments made by users on forum topics, allowing for discussion and interaction within the forum. It now supports nested comments (replies).

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the comment |
| topic_id | integer | NOT NULL, FOREIGN KEY | | ID of the topic being commented on |
| user_id | integer | NOT NULL, FOREIGN KEY | | ID of the user who made the comment |
| content | text | NOT NULL | | The content of the comment |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the comment was created |
| updated_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the comment was last updated |
| parent_comment_id | integer | UNSIGNED, FOREIGN KEY | NULL | ID of the parent comment (for replies) |

## Constraints

- Foreign key on `topic_id` referencing the `forum_topics` table with ON DELETE CASCADE
- Foreign key on `user_id` referencing the `users` table with ON DELETE CASCADE
- Foreign key on `parent_comment_id` referencing the `forum_comments` table with ON DELETE CASCADE

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| forum_comments_pkey | id | B-tree | Primary key index |
| idx_forum_comments_topic_id | topic_id | B-tree | For efficient queries by topic |
| idx_forum_comments_user_id | user_id | B-tree | For efficient queries by user |
| idx_forum_comments_created_at | created_at | B-tree | For efficient sorting by creation date |
| idx_forum_comments_parent_comment_id | parent_comment_id | B-tree | For efficient queries on replies to comments |

## Relationships

- Belongs to a topic (`forum_topics` table)
- Belongs to a user (`users` table)
- Can belong to a parent comment (self-referential relationship for replies)

## Notes

- The `parent_comment_id` allows for nested comments (replies).
- Comments with `parent_comment_id` set to NULL are top-level comments.
- Consider adding a `likes` column to track the popularity of comments.
- Consider adding an `is_edited` boolean column to indicate if a comment has been edited.

## Example Queries

1. Get all top-level comments for a specific topic with user information:   ```sql
   SELECT c.*, u.username 
   FROM forum_comments c
   JOIN users u ON c.user_id = u.id
   WHERE c.topic_id = ? AND c.parent_comment_id IS NULL
   ORDER BY c.created_at ASC;   ```

2. Get replies to a specific comment:   ```sql
   SELECT c.*, u.username 
   FROM forum_comments c
   JOIN users u ON c.user_id = u.id
   WHERE c.parent_comment_id = ?
   ORDER BY c.created_at ASC;   ```

3. Get the most recent comments across all topics:   ```sql
   SELECT c.*, u.username, t.title as topic_title
   FROM forum_comments c
   JOIN users u ON c.user_id = u.id
   JOIN forum_topics t ON c.topic_id = t.id
   ORDER BY c.created_at DESC
   LIMIT 20;   ```

4. Get comment count for each topic:   ```sql
   SELECT topic_id, COUNT(*) as comment_count
   FROM forum_comments
   GROUP BY topic_id;   ```

## Maintenance

- Regularly check for and remove spam comments.
- Implement a mechanism to flag inappropriate comments for moderation.
- Consider implementing a soft delete mechanism for comments instead of hard deletes.
- Periodically archive old comments to improve database performance if the table grows very large.
- Ensure that when a parent comment is deleted, its replies are either deleted or re-parented to maintain the comment structure.
