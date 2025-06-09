# PDF Comments Table

## Purpose
Stores public comments on PDFs, allowing for discussion and feedback. Supports nested replies.

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the comment |
| pdf_id | integer | NOT NULL, FOREIGN KEY | | ID of the PDF being commented on |
| user_id | integer | NOT NULL, FOREIGN KEY | | ID of the user who made the comment |
| comment | text | NOT NULL | | The content of the comment |
| page_number | integer | | NULL | Page of the PDF the comment refers to |
| created_at | timestamp with time zone | | CURRENT_TIMESTAMP | When the comment was created |
| updated_at | timestamp with time zone | | CURRENT_TIMESTAMP | When the comment was last updated |
| parent_comment_id | integer | FOREIGN KEY | NULL | ID of the parent comment (for replies) |
| is_pinned | boolean | | false | Whether the comment is pinned by a moderator |
| is_approved | boolean | | true | Whether the comment is visible |
| is_edited | boolean | | false | Whether the comment has been edited |

## Relationships
- `pdf_id` references `pdfs.id` with CASCADE on delete
- `user_id` references `users.id` with CASCADE on delete
- `parent_comment_id` references `pdf_comments.id` with SET NULL on delete

## Indexes
| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| pdf_comments_pdf_id_idx | pdf_id | B-tree | Quickly fetch comments for a PDF |
| pdf_comments_parent_comment_id_idx | parent_comment_id | B-tree | Retrieve replies for a comment |
| pdf_comments_user_id_idx | user_id | B-tree | Lookup comments by user |

## API Endpoints
- `GET /api/pdfs/[id]/comments` – list comments for a PDF including commenter info.
- `POST /api/pdfs/[id]/comments` – create a new comment. Requires `user_id` and `comment`; accepts optional `parent_comment_id`.
