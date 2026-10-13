# BibleChorus

A community for Scripture-inspired music and musical journeys of faith. Built with Next.js Pages Router, React, TypeScript, Tailwind/shadcn UI, PostgreSQL/Knex, and AWS S3/CloudFront.

## Run and verify

Use Node 22.12 or later (Node 22 LTS is configured for Replit and CI). Install the locked dependencies and run the offline checks:

```sh
npm ci
npm run check
npm run build
```

Configure the existing runtime environment, then use `npm run dev` (port 5000). Production uses `npm run start` (port 3000). Replit publishes a separate workspace snapshot; a GitHub push alone does not update production.

Tests mock database, storage, and email boundaries. They verify ownership and preservation behavior, OAuth/session handling, presigned upload metadata, browser credential isolation, and real React audio/queue behavior. No live credentials are needed for lint, typecheck, tests, or a production build.

## Features

| Area | Routes and capabilities |
| --- | --- |
| Music | `/listen`, `/Songs/[id]`: filtering, sorting, likes, votes, comments, Scripture/lyric comparison, sharing, artwork and metadata edits |
| Playback | Persistent queue, shuffle, repeat, seek, minimized controls, media-session integration |
| Contributions | `/upload`: Scripture/journey song types, human/AI attribution, Bible metadata, audio/art uploads and image cropping |
| Journeys | `/journeys`, `/journeys/[username]`, `/journeys/edit`: public/private portfolios, seasons, songs, reflections, milestones/photos, source links, themes/layouts, likes, AI exports and NotebookLM |
| Collections | `/playlists`, `/playlists/[id]`: public/private playlists, automatic filters, saved collections, ordering, covers, editing |
| Community | `/forum`, `/Forum/topics/[id]`: categories, topics, rich-text replies, votes, moderator locks |
| Study | `/pdfs`, `/pdfs/[id]`, `/pdfs/upload`: uploads, text/verse extraction, reading/fullscreen, comments, ratings, private page notes and study links |
| Coverage | `/progress`: passage coverage, filters, statistics and charts |
| Profiles | `/profile`: contributions, collections, activity notifications/read state and profile artwork |
| Accounts/help | `/login`, `/how-to`: email/password and Google sign-in, account creation, policies, creator guide |

## Runtime configuration

Set secrets in the deployment environment, never in committed files or Next.js client-inlining configuration.

- `JWT_SECRET` (or legacy-compatible `NEXTAUTH_SECRET`) for app bearer sessions; `NEXTAUTH_SECRET` for Google sessions.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_URL` for Google OAuth.
- A complete `PGHOST`, `PGUSER`, and `PGDATABASE` configuration (with `PGPASSWORD` and optional `PGPORT`), or `NEON_DATABASE_URL`/`DATABASE_URL` for PostgreSQL.
- `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_S3_BUCKET_NAME` for S3.
- `CDN_URL`, `CLOUDFRONT_URL`, `NEXT_PUBLIC_CDN_URL` for existing media URL forms.
- `NEXT_PUBLIC_BASE_URL` for public links and email destinations.
- `SENDGRID_API_KEY` for user-requested reports.

Database precedence is deterministic: complete PG fields first, then
`DATABASE_URL`, then `NEON_DATABASE_URL`. Replit saves the previous Neon URL as
`NEON_DATABASE_URL` after an infrastructure upgrade; `DATABASE_URL` remains the
current target. Incomplete PG fields do not override a
valid URL. Credentials resolve only when a connection is needed, so builds can
run without them; a runtime request with no valid configuration fails clearly
without guessing a local database. URL SSL/certificate parameters are preserved
for the PostgreSQL driver. URLs without those parameters default to verified
TLS for external hosts; exact loopback/localhost/Helium hosts and reserved local
host suffixes (`.helium`, `.internal`, `.localhost`, `.local`) use local non-SSL
connections, independently of `NODE_ENV`. Explicit `PGSSL` (`true`/`false` or a PostgreSQL SSL mode) takes precedence
over `PGSSLMODE` when the selected URL has no SSL options. The original PG mode
retains its existing TLS default when neither setting is present.
See [Replit's database upgrade guidance](https://docs.replit.com/features/data-and-storage/development-and-production).

Presigned browser uploads need bucket CORS allowing PUT and Content-Type from the app's production and preview origins. File/Blob upload length is supplied by the browser. Limits remain 200 MB for audio, 5 MB for images, and 10 MB for study PDFs. PDF uploads extract embedded text and link detected scripture references; OCR for scanned PDFs remains an operational extension, not an implemented fallback.

## Data and architecture

Table contracts are in `Reference/`. Both database import paths share one pool. Shared authentication/ownership helpers, storage-key validation, and scripture synchronization protect the existing data contracts. The design uses one responsive shell and token palette; journey comparison panels are ready for future original-source attachments without changing the stored source model now.

**Do not run the entire historical migration chain against existing or fresh databases without review.** Older migrations contain ordering problems and destructive history operations. Builds and startup do not run migrations. The new moderator-lock migration is additive and idempotent; first check the existing schema, then apply only that migration if the column is absent.

Read [the rework and deployment notes](docs/site-rework.md), [API security contracts](Reference/api_security_reference.md), [journey contracts](Reference/journeys_reference.md), and [playback contracts](Reference/music_playback_reference.md) before extending those areas. Preserve provider backups and production records independently of Git snapshots.
