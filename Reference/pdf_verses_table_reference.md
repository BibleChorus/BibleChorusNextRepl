# PDF Verses Table

## Purpose
Establishes a many-to-many relationship between PDFs and Bible verses, similar to the `song_verses` table.

## Columns and Types

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| pdf_id | integer | NOT NULL, FOREIGN KEY | ID of the PDF |
| verse_id | integer | NOT NULL, FOREIGN KEY | ID of the Bible verse |

## Primary Key
Composite primary key on (`pdf_id`, `verse_id`).

## Foreign Keys

| Column | References | On Delete |
|--------|------------|-----------|
| pdf_id | pdfs(id) | CASCADE |
| verse_id | bible_verses(id) | CASCADE |

## Indexes
The primary key columns are automatically indexed for efficient lookups.

## Notes
- Prevents duplicate PDF-to-verse mappings through the composite primary key.
