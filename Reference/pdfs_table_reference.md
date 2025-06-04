# PDFs Table

## Purpose
Stores metadata for uploaded PDF documents containing scriptural or thematic content.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the PDF |
| title | string(255) | NOT NULL | | Title of the document |
| author | string(255) | | | Author or source of the document |
| pdf_url | string(255) | NOT NULL | | S3 key/URL of the uploaded PDF |
| ai_assisted | boolean | | false | Indicates if AI assisted in creation |
| themes | text[] | | | Array of themes/tags associated with the PDF |
| uploaded_by | integer | FOREIGN KEY (users.id) | | ID of the user who uploaded |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the PDF was uploaded |

## Relationships

- `uploaded_by` references the `id` column in the `users` table.
