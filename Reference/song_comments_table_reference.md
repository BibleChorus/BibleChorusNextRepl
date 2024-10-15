# Song Comments Table

## Purpose
This table stores comments made by users on songs, allowing for discussion and feedback on individual songs.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the comment |
| song_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | | ID of the song being commented on |
| user_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | | ID of the user who made the comment |
| comment | text | NOT NULL | | The content of the comment |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the comment was created |
| updated_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the comment was last updated |
| likes | integer | UNSIGNED | 0 | Number of likes the comment has received |
| is_pinned | boolean | | false | Indicates if the comment is pinned |
| is_approved | boolean | | true | Indicates if the comment has been approved |
| parent_comment_id | integer | UNSIGNED, FOREIGN KEY | | ID of the parent comment (for replies) |
| is_edited | boolean | | false | Indicates if the comment has been edited |
| sentiment | string(20) | | | Sentiment analysis of the comment |
| contains_scripture_reference | boolean | | false | Indicates if the comment contains a scripture reference |

## Constraints

- Foreign key on `song_id` referencing the `songs` table with CASCADE on delete
- Foreign key on `user_id` referencing the `users` table with CASCADE on delete
- Foreign key on `parent_comment_id` referencing the `song_comments` table with SET NULL on delete

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| song_comments_pkey | id | B-tree | Primary key index |
| song_comments_song_id_idx | song_id | B-tree | For efficient queries on comments for a specific song |
| song_comments_user_id_idx | user_id | B-tree | For efficient queries on comments by a specific user |
| song_comments_parent_comment_id_idx | parent_comment_id | B-tree | For efficient queries on replies to comments |

## Relationships

- Belongs to a song (`songs` table)
- Belongs to a user (`users` table)
- Can belong to a parent comment (self-referential relationship for replies)

## Notes

- The `parent_comment_id` allows for nested comments (replies).
- The `is_pinned` flag can be used to highlight important comments.
- The `is_approved` flag allows for moderation of comments before they are publicly visible.
- The `sentiment` column can be used to store the result of sentiment analysis on the comment.
- The `contains_scripture_reference` flag can be used to quickly identify comments that reference scripture.

## Example Queries

1. Get all approved comments for a specific song:
   ```sql
   SELECT * FROM song_comments
   WHERE song_id = ? AND is_approved = true
   ORDER BY created_at DESC;
   ```

2. Get replies to a specific comment:
   ```sql
   SELECT * FROM song_comments
   WHERE parent_comment_id = ?
   ORDER BY created_at;
   ```

3. Get pinned comments for a song:
   ```sql
   SELECT * FROM song_comments
   WHERE song_id = ? AND is_pinned = true
   ORDER BY created_at DESC;
   ```

4. Get comments with scripture references:
   ```sql
   SELECT * FROM song_comments
   WHERE song_id = ? AND contains_scripture_reference = true
   ORDER BY created_at DESC;
   ```

## Maintenance

- Regularly review and approve or reject comments with `is_approved = false`.
- Implement a system to update the `sentiment` column based on the comment content.
- Consider implementing a system to automatically detect and flag potential scripture references.
- Monitor for spam or inappropriate comments and implement measures to prevent misuse.
- Periodically clean up orphaned replies (where the parent comment has been deleted) if not handled by application logic.
