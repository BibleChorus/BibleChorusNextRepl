# Development Log

## 2025-06-03
- Added PDF upload and reader feature. Users can submit PDF documents with Bible study content which are processed for verse references.
- Created database tables: `pdfs`, `pdf_comments`, `pdf_notes`, `pdf_ratings`, and `pdf_verses`.
- PDFs can be commented on, rated, and linked to verses similar to songs.

## 2025-06-04
- Linked the new PDFs page from the homepage and sidebar navigation.

## 2025-06-05
- Created a dashboard at `/pdfs` listing all uploaded PDFs with search and links to individual documents.

## 2025-06-06
- Fixed runtime error on the PDF upload page by wrapping the form in `FormProvider` so `PdfUploadProgressBar` can access form context.
## 2025-06-07
- Fixed form submission for PDF uploads by inserting the URL into the `file_url` column instead of a nonexistent `pdf_url` field.

## 2025-06-08
- Updated shuffle mode to load all songs for the current filters so shuffle picks from the full list.

## 2025-06-09
- Shuffle button now preloads and shuffles every song that matches the current filters when enabled.
