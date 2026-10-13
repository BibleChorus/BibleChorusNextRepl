# PDF Notes Table

## Purpose
Stores private notes that users attach to PDFs for personal study.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the note |
| pdf_id | integer | NOT NULL, FOREIGN KEY | | ID of the PDF this note belongs to |
| user_id | integer | NOT NULL, FOREIGN KEY | | Owner of the note |
| note | text | NOT NULL | | Content of the note |
| page_number | integer | | NULL | Page reference if applicable |
| created_at | timestamp | | CURRENT_TIMESTAMP | When the note was created |
| updated_at | timestamp | | CURRENT_TIMESTAMP | When the note was last updated |

## Relationships
- `pdf_id` references `pdfs.id` with CASCADE on delete
- `user_id` references `users.id` with CASCADE on delete

## Indexes
| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| pdf_notes_pdf_user_idx | (pdf_id, user_id) | B-tree | Quickly fetch a user's notes for a PDF |

## Server-rendered privacy

The PDF detail page resolves the authenticated viewer before loading notes. Only rows matching that viewer’s `user_id` are included in page props; signed-out visitors receive an empty note list. Public comments remain visible independently of personal notes.

## Storage and response compatibility

The existing database stores note text in the `note` column. There is no `content` storage column. Note forms continue sending a single `note` field; no existing note rows are rewritten. The reader accepts an optional `content` response alias and displays `content ?? note`, so both adapted responses and the raw server-rendered legacy rows remain readable. After authentication restores, the reader fetches the current account’s notes and clears account-specific notes and drafts when the account changes.
