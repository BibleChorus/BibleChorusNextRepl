# PDF Ratings Table

## Purpose
Stores user ratings for PDFs across multiple categories such as quality, theology, and helpfulness.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the rating |
| pdf_id | integer | NOT NULL, FOREIGN KEY | | ID of the rated PDF |
| user_id | integer | NOT NULL, FOREIGN KEY | | ID of the user giving the rating |
| quality | smallint | | 0 | Quality rating (-1, 0, 1) |
| theology | smallint | | 0 | Theological soundness rating |
| helpfulness | smallint | | 0 | Helpfulness rating |

## Constraints
- Unique constraint on (`pdf_id`, `user_id`) so each user rates a PDF only once

## Relationships
- `pdf_id` references `pdfs.id` with CASCADE on delete
- `user_id` references `users.id` with CASCADE on delete

