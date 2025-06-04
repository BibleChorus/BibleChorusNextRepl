# Teachings Module

## Overview
The Teachings module allows users to upload PDF Bible teachings and share them with the community. Uploaded files are parsed to extract scripture references and displayed in a built-in PDF reader. Other members can comment on and rate these teachings.

## Database Schema

### teachings
- **id**: Primary key.
- **title**: Display title of the teaching.
- **slug**: URL-friendly unique identifier derived from the title.
- **description**: Optional summary.
- **pdf_url**: Path to the stored PDF file.
- **pdf_text**: Extracted text used for search and verse detection.
- **based_on_type**: `theme` or `passage` depending on how `reference` should be interpreted.
- **reference**: Theme keyword or Bible passage reference.
- **ai_generated**: Indicates if the content was created with AI assistance.
- **ai_prompt**: Prompt text used when generating content with AI.
- **ai_model_used**: Name of the AI model, if applicable.
- **tags**: Array of keywords for filtering.
- **language**: Language code of the document, default `en`.
- **uploaded_by**: References `users.id` of the uploader.
- **view_count**: Number of times the teaching has been viewed.
- **rating_total** and **rating_count**: Sum of rating values and count of ratings to derive an average.
- **created_at / updated_at**: Timestamps managed by Knex.

### teaching_verses
Links teachings to verses that were detected in the PDF.

### teaching_comments
Stores user comments on a teaching.
- Includes nested comments via `parent_comment_id` and moderation fields such as `is_approved` and `is_pinned`.
- `likes` tracks simple like counts.
- `sentiment` and `contains_scripture_reference` allow future analytics on comment tone and content.

## Upload Flow
1. User fills out the upload form specifying whether the teaching is based on a theme or passage and if AI was involved.
2. The PDF is uploaded via `/api/teachings`.
3. Text is extracted server-side to discover scripture references.
4. A slug is generated from the title and the record is created in the `teachings` table.
5. Detected verses are stored in `teaching_verses` for quick lookup.

## Viewing a Teaching
The `/learn/[id]` page renders the PDF using `react-pdf` and shows metadata. Future enhancements can display related verses, tags, and ratings.

## Comments and Ratings
Users can post comments via `/api/teachings/[id]/comments`. Each comment may be liked and moderated. Ratings will use the `rating_total` and `rating_count` fields to calculate averages when implemented.

