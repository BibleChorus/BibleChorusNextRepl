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
| image_url | string(255) | NULLABLE | null | Cover image for this PDF |
| notebook_lm_url | string(255) | | | Link to a related NotebookLM notebook |
| summary | text | | | One-paragraph summary of the PDF |
| source_url | string(255) | | | Original source or external link |
| ai_assisted | boolean | NOT NULL | false | Indicates if AI assisted in creation |
| themes | text[] | NOT NULL | '{}' | Array of themes/tags associated with the PDF |
| uploaded_by | integer | NOT NULL, FOREIGN KEY (users.id) | | ID of the user who uploaded |
| description | text | | | Optional description for the PDF |
| is_public | boolean | NOT NULL | true | Whether the PDF is publicly visible |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | Record creation timestamp |
| uploaded_at | timestamp with time zone | | CURRENT_TIMESTAMP | Date and time the PDF was uploaded |

## Relationships

- `uploaded_by` references the `id` column in the `users` table.
- A PDF can have many entries in `pdf_comments`, `pdf_notes`, and `pdf_ratings`.
- Linked verses are stored in the `pdf_verses` join table.

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| pdfs_uploaded_by_idx | uploaded_by | B-tree | For efficient queries on a user's uploads |
| pdfs_created_at_idx | created_at | B-tree | For sorting or filtering by creation time |
| pdfs_uploaded_at_idx | uploaded_at | B-tree | For sorting or filtering by upload date |

## Environment Configuration

These environment variables control PDF storage in AWS S3:

- `AWS_S3_BUCKET_NAME` – target bucket for PDF uploads.
- `AWS_REGION` – AWS region of the bucket.
- `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` – credentials used by the server.
- `CDN_URL` – optional base URL when serving uploaded PDFs.
