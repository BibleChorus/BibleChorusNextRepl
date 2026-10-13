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

## 2025-06-20
- Removed in-app PDF viewer and replaced it with a simple "Open PDF" button.
- The PDF detail page now highlights the NotebookLM link with an icon and tooltip.
- Deleted the obsolete `/pdf-viewer` route.

## 2025-06-26
- Fixed PDF cover images showing a broken URL when `NEXT_PUBLIC_CDN_URL` was unset.
- The PDF list and detail pages now check if `image_url` already includes a protocol before prefixing the CDN URL.


## 2025-06-27
- Comment form now accepts an optional page number. If provided, the comment shows a link that opens the PDF at that page.

## 2025-06-30
- Removed `source_url` and `uploaded_at` columns from PDFs.
- Updated NotebookLM icon with a white background and blue fill to improve dark mode visibility.
## 2025-07-03
- Restyled forum vote buttons to a compact horizontal layout.
- Updated forum comment boxes with glassmorphism borders and spacing.
- Tweaked the forum text editor styling for a cleaner look.

## 2026-10-13 — Application rework

Reworked the application shell and all main sections around a shared warm design, clearer hierarchy, responsive controls, and accessible navigation. Journey songs now sit alongside their reflections in an extensible comparison panel; existing source links, themes, editing, and data remain available. Music playback uses stable queue occurrence identity and nonblocking load states. Unified query/database clients and removed duplicate ambient styling and shadow type stubs.

Added shared server authentication and ownership checks, verified upload metadata, preservation-aware file cleanup, private study notes, moderator locking, and corrected OAuth cookie/form handling. Updated compatible security dependencies and removed unused storage/UUID libraries. Added offline regression checks, CI, and deployment documentation. Source changes do not run legacy migrations or mutate production records.

Clean-install CI exposed an npm peer-lock discrepancy and a patched sanitizer requiring Node 22. Updated the lock with the deployment-compatible npm resolver, made its YAML peer explicit, and aligned CI/Replit on Node 22 while preserving the existing Python module.
## 2026-10-13 — Production database TLS and source synchronization

- Require certificate-validating TLS through the GitHub-controlled production run configuration while retaining the single current database URL and local preview behavior.
- Preserve database identity and configured certificates; no records, schema, secrets, or media are changed by this correction.
- Reject incomplete current connection URLs rather than inheriting legacy PostgreSQL environment settings.
- Keep Replit aligned with GitHub main before release handoff, preserving any local-only work before alignment and preparing the requested republish button without publishing automatically.

## 2026-10-13 — Managed production database name

- Replit's managed production `DATABASE_URL` omits the database name and publishing restores that value, so every published database request failed validation. The tracked deployment command now supplies `DATABASE_NAME=neondb`, used only when the URL has no database path.
- The app still uses Replit's current managed URL, host, credentials, and verified TLS; no records, schema, or secrets are changed.

## 2026-10-13 — Production authentication and current music attribution

- Bundle Auth.js through Next's supported package transpilation so production Google sign-in can resolve Next server imports correctly.
- Exercise the real production authentication bridge after a fresh build, including provider and CSRF endpoints, using synthetic configuration without live credentials or database access.
- Add the observed Suno V6 model to the upload selector so current recordings can retain accurate attribution.

## 2026-10-13 — Braces stack-exhaustion mitigation

- npm audit identifies GHSA-vfj7-8cjw-p6xm in the current `braces@3.0.3` lock entry. This newer advisory has no published patched release; 3.0.3 already fixes the older CVE-2024-4068.
- Apply a narrow version-pinned dependency patch that rejects more than 100 nested brace/parenthesis blocks and bounds AST/parent traversal. Verify exact installed patched source before dev/build/start, and fail installation when applying the patch fails.
- Preserve ordinary glob watching, matching and range expansion with offline security and consumer regression tests. Keep the genuine package version and audit findings visible; this mitigation does not establish closure of Dependabot alert #241.

## 2026-10-13 — Journey Originals

- Add private-by-default original recordings, plain-text journals, images, and PDFs to saved journey song entries, preserving music-library songs, reflections, and source links.
- Add accessible labels/reordering, explicit sharing, lazy protected previews, pending upload recovery, and independent audio positions alongside the existing song/context layout.
- Enforce current authorization on journal details, file/range delivery, and opt-in exports. Verify declared size/type and stored signatures, then finalize to immutable private keys. Fail binary storage closed until separately verified without creating services/permissions.
- Add a targeted additive table migration and read-only inspection/apply helper. No live migrations, storage changes, merge, or publication occurred during source development. Record validation and remaining rollout prerequisites in the draft PR and `docs/journey-originals.md`.
