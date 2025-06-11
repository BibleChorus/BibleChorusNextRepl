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

## 2025-06-10
- Replaced the old react-pdf viewer with the Doqment PDF.js viewer.
- PDFs now open in an iframe at `/pdf-viewer` with smart zoom and the ability to hide the toolbar.
- The viewer also respects the site's light and dark themes.

## 2025-06-11
- Fixed cross-origin errors preventing PDFs from loading in the viewer.
- `/pdf-viewer` now renders without the main layout and includes a fullscreen toggle.

## 2025-06-12
- Added `allow="fullscreen"` to PDF iframes so the viewer can request fullscreen mode.

## 2025-06-13
- The fullscreen toggle now uses the browser Fullscreen API and shows a toast when entering or exiting fullscreen.

## 2025-06-14
- Fixed PDF viewer fullscreen toggle to work across browsers by requesting fullscreen on the iframe's document and adding `allowFullScreen`.

## 2025-06-15
- Refined fullscreen logic with vendor-prefixed fallbacks so PDF viewer can reliably enter fullscreen.

## 2025-06-16
- Extended PDF metadata to include a NotebookLM link, summary, and source URL.
- Updated upload and edit forms to handle these fields.

## 2025-06-17
- Added image upload support for PDFs.
- Increased quality setting for image uploads.

## 2025-06-18
- Added `uploaded_at` column to PDFs table.
