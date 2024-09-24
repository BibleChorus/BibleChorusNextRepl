# Progress Materialized View

## Purpose
This materialized view aggregates data from the bible_verses table to provide a comprehensive overview of Bible coverage progress across various categories and books.

## Columns and Types

| Column Name | Type | Description |
|-------------|------|-------------|
| book | string | Name of the Bible book |
| testament | string | 'Old Testament' or 'New Testament' |
| total_verses | integer | Total number of verses in the book |
| verses_covered | integer | Number of verses covered by any song |
| ai_lyrics_verses | integer | Number of verses covered by AI-generated lyrics |
| human_lyrics_verses | integer | Number of verses covered by human-written lyrics |
| ai_music_verses | integer | Number of verses covered by AI-generated music |
| human_music_verses | integer | Number of verses covered by human-composed music |
| continuous_passage_verses | integer | Number of verses used in continuous passage songs |
| non_continuous_passage_verses | integer | Number of verses used in non-continuous passage songs |
| word_for_word_verses | integer | Number of verses used word-for-word in songs |
| close_paraphrase_verses | integer | Number of verses used as close paraphrases in songs |
| creative_inspiration_verses | integer | Number of verses used as creative inspiration in songs |
| book_percentage | float | Percentage of verses covered in the book |
| ai_lyrics_percentage | float | Percentage of verses covered by AI-generated lyrics |
| human_lyrics_percentage | float | Percentage of verses covered by human-written lyrics |
| ai_music_percentage | float | Percentage of verses covered by AI-generated music |
| human_music_percentage | float | Percentage of verses covered by human-composed music |
| continuous_passage_percentage | float | Percentage of verses used in continuous passage songs |
| non_continuous_passage_percentage | float | Percentage of verses used in non-continuous passage songs |
| word_for_word_percentage | float | Percentage of verses used word-for-word in songs |
| close_paraphrase_percentage | float | Percentage of verses used as close paraphrases in songs |
| creative_inspiration_percentage | float | Percentage of verses used as creative inspiration in songs |

## Source Data
The view combines data from two main sources:
1. A static table of Bible books with their total verse counts
2. The `bible_verses` table, which contains information about individual verses and their usage in songs

## Calculation Method
- Verse counts are calculated using COUNT(*) with FILTER clauses on the respective array columns in the `bible_verses` table.
- Percentages are calculated by dividing the verse counts by the total verses in each book and multiplying by 100.

## Usage Notes
- This view provides a quick way to analyze Bible coverage across different categories without the need for complex joins or calculations at query time.
- The view should be refreshed periodically to reflect the latest data in the `bible_verses` table.
- Querying this view will be faster than calculating the same information on-the-fly, especially for frequently accessed statistics.

## Refresh Strategy
The materialized view is refreshed using the `refreshProgressMaterializedView` function in the `db-utils.ts` file. This function is called after successful song submission (in `submit-song.ts`) and song deletion (in `delete.ts`). Consider setting up a scheduled task to refresh this materialized view regularly, depending on the frequency of updates to the underlying `bible_verses` table.

## Constants Integration
The materialized view can be used in conjunction with data from the `constants.ts` file, which contains information such as `BIBLE_BOOKS`, `VERSE_COUNTS`, and `BIBLE_BOOK_INFO`. This combination allows for more comprehensive analysis and reporting of Bible coverage progress.

## Example Queries

1. Get overall progress for each book:
sql
SELECT
book,
testament,
verses_covered,
total_verses,
book_percentage
FROM progress_materialized_view
ORDER BY testament, book_percentage DESC;

2. Find books with the highest AI-generated lyrics coverage:

sql
SELECT
book,
ai_lyrics_verses,
total_verses,
ai_lyrics_percentage
FROM progress_materialized_view
ORDER BY ai_lyrics_percentage DESC
LIMIT 10;

3. Compare human-written vs AI-generated lyrics coverage:

sql
SELECT
book,
human_lyrics_percentage,
ai_lyrics_percentage,
(human_lyrics_percentage - ai_lyrics_percentage) as difference
FROM progress_materialized_view
ORDER BY difference DESC;

## Updating the View
To refresh the materialized view with the latest data, use the following SQL command:

sql
REFRESH MATERIALIZED VIEW progress_materialized_view;


This command is wrapped in the `refreshProgressMaterializedView` function in `db-utils.ts`.

## Dependencies
This materialized view depends on the `bible_verses` table. Any structural changes to that table may require updates to this view.