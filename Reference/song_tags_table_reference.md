# Song Tags Table

## Purpose
This table stores tags associated with songs, allowing for categorization and improved searchability of songs.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the song tag |
| song_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | | ID of the song associated with the tag |
| tag | string(50) | NOT NULL | | The tag text |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the tag was created |
| created_by | integer | UNSIGNED, FOREIGN KEY | | ID of the user who created the tag |
| is_approved | boolean | | true | Indicates if the tag has been approved |
| usage_count | integer | UNSIGNED | 1 | Number of times this tag has been used |

## Constraints

- Unique constraint on the combination of `song_id` and `tag`
- Foreign key on `song_id` referencing the `songs` table with CASCADE on delete
- Foreign key on `created_by` referencing the `users` table with SET NULL on delete

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| song_tags_pkey | id | B-tree | Primary key index |
| song_tags_song_tag_unique | (song_id, tag) | B-tree | Unique constraint index |

## Relationships

- Belongs to a song (`songs` table)
- Belongs to a user (`users` table) who created the tag

## Notes

- The unique constraint on `song_id` and `tag` ensures that a song can't have duplicate tags.
- The `is_approved` flag allows for moderation of tags before they are publicly visible.
- The `usage_count` can be used to track popular tags across all songs.
- The CASCADE delete rule on `song_id` ensures that tags are removed when a song is deleted.
- The SET NULL delete rule on `created_by` allows tags to persist even if the user who created them is deleted.

## Example Queries

1. Get all tags for a specific song:
   ```sql
   SELECT tag FROM song_tags
   WHERE song_id = ? AND is_approved = true;
   ```

2. Get the most popular tags:
   ```sql
   SELECT tag, SUM(usage_count) as total_usage
   FROM song_tags
   WHERE is_approved = true
   GROUP BY tag
   ORDER BY total_usage DESC
   LIMIT 10;
   ```

3. Find songs with a specific tag:
   ```sql
   SELECT song_id FROM song_tags
   WHERE tag = ? AND is_approved = true;
   ```

4. Get unapproved tags for moderation:
   ```sql
   SELECT * FROM song_tags
   WHERE is_approved = false
   ORDER BY created_at;
   ```

## Maintenance

- Regularly review and approve or reject tags with `is_approved = false`.
- Consider implementing a system to merge similar tags or correct misspellings.
- Periodically update the `usage_count` if it becomes out of sync with actual usage.
- Monitor for spam or inappropriate tags and implement measures to prevent misuse.
