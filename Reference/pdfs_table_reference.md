# PDFs Table

## Purpose
Stores metadata for uploaded PDF documents containing scriptural or thematic content.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the PDF |
| title | string(255) | NOT NULL | | Title of the document |
| author | string(255) | | | Author or source of the document |
| file_url | string(255) | NOT NULL | | Location of the PDF in S3 or CDN |
| ai_assisted | boolean | NOT NULL | false | Indicates if AI assisted in creation |
| themes | text[] | NOT NULL | '{}' | Array of themes/tags associated with the PDF |
| uploaded_by | integer | NOT NULL, FOREIGN KEY (users.id) | | ID of the user who uploaded |
| description | text | | | Optional description for the PDF |
| is_public | boolean | NOT NULL | true | Whether the PDF is publicly visible |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Timestamp of when the PDF was uploaded |

## Relationships

- `uploaded_by` references the `id` column in the `users` table.

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| pdfs_uploaded_by_idx | uploaded_by | B-tree | For efficient queries on a user's uploads |
| pdfs_created_at_idx | created_at | B-tree | For sorting or filtering by creation time |
