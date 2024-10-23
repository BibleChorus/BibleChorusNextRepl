# Votes Table

## Purpose
This table stores information about votes cast by users on songs, allowing for different types of votes (Best Musically, Best Lyrically, Best Overall).

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the vote |
| user_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | | ID of the user who cast the vote |
| song_id | integer | NOT NULL, UNSIGNED, FOREIGN KEY | | ID of the song being voted on |
| vote_type | enum | NOT NULL | | Type of vote ('Best Musically', 'Best Lyrically', 'Best Overall') |
| vote_value | integer | NOT NULL, CHECK IN (-1, 0, 1) | | Value of the vote (-1 for downvote, 0 for neutral, 1 for upvote) |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the vote was cast |
| is_new | boolean | | true | Indicates if the vote is unread by the recipient |

## Constraints

- Unique constraint on the combination of `user_id`, `song_id`, and `vote_type`
- Foreign key on `user_id` referencing the `users` table with CASCADE on delete
- Foreign key on `song_id` referencing the `songs` table with CASCADE on delete
- Check constraint on `vote_value` to ensure it's either -1, 0, or 1

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| votes_pkey | id | B-tree | Primary key index |
| votes_user_song_type_unique | (user_id, song_id, vote_type) | B-tree | Unique constraint index |
| idx_votes_is_new | is_new | B-tree | For efficient queries on unread votes |

## Relationships

- Belongs to a user (`users` table)
- Belongs to a song (`songs` table)

## Notes

- The unique constraint ensures that a user can only cast one vote of each type for a song.
- The CASCADE delete rules ensure that votes are removed when a user or song is deleted.
- The `vote_type` enum allows for different categories of voting.
- The `vote_value` allows for upvotes, downvotes, and neutral votes.

## Example Queries

1. Get all votes for a specific song:
   ```sql
   SELECT * FROM votes
   WHERE song_id = ?;
   ```

2. Get the total score for each vote type for a song:
   ```sql
   SELECT vote_type, SUM(vote_value) as total_score
   FROM votes
   WHERE song_id = ?
   GROUP BY vote_type;
   ```

3. Get the top songs based on a specific vote type:
   ```sql
   SELECT song_id, SUM(vote_value) as score
   FROM votes
   WHERE vote_type = ?
   GROUP BY song_id
   ORDER BY score DESC
   LIMIT 10;
   ```

4. Get a user's votes for a specific song:
   ```sql
   SELECT vote_type, vote_value
   FROM votes
   WHERE user_id = ? AND song_id = ?;
   ```

## Maintenance

- Regularly check for any votes with invalid `vote_value` (not -1, 0, or 1) and correct them.
- Consider implementing a cleanup process for votes on deleted songs if not handled by the CASCADE delete rule.
- Monitor the distribution of votes to ensure the voting system is being used as intended.
