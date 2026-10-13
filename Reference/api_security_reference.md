# API authentication and file preservation

## Identity

`lib/server-auth.ts` is the shared boundary for API identity. It verifies legacy
HS256 bearer tokens, the application's HttpOnly `token` cookie, and Auth.js
sessions, then loads the current user and permissions from PostgreSQL. Body
properties such as `user_id`, `uploaded_by`, and `userId` never authorize writes.
Legacy mutation routes retain their existing request and response shapes, but
derive attribution from the verified session. Content edits require its owner;
forum locking requires a current moderator or administrator role.

Login and registration still return `{ user, token }` and now establish a
same-site HttpOnly cookie. `GET /api/auth/session` verifies a session and returns
`{ user, token }`, allowing an existing bearer or Google login to restore the
client and establish the application cookie. `POST /api/auth/logout` expires it.
The client also signs out of Auth.js. Authentication responses use `no-store`.
`JWT_SECRET` falls back to `NEXTAUTH_SECRET` at runtime for older deployments;
these values must never appear in Next.js client `env` configuration.

The Auth.js Pages adapter preserves form-encoded POST bodies and each Set-Cookie
header. Its session cookie uses the Secure prefix only in production.

## Files

`lib/storage-keys.ts` accepts historical raw keys, leading slash keys, and URLs
from the configured CDN. It validates ownership by the exact `uploads/{userId}/`
prefix. New presigned uploads use unique object keys, a signed declared length,
and a 15-minute expiry. Limits remain 200MB for audio, 5MB for images, and 10MB
for PDFs. Song and PDF submission additionally check the actual stored object's
size and content type before committing metadata.

The SDK checksum setting is `WHEN_REQUIRED`: the browser uploads the body after
signing, so the server must not bake the checksum of an empty signing body into
its URL. PUT URLs sign content type and content length. The browser supplies the
known File/Blob length automatically; callers must send the same Content-Type.
The bucket's existing CORS policy must allow the app origin, PUT, and
Content-Type. See the [Fetch network algorithm](https://fetch.spec.whatwg.org/#http-network-or-cache-fetch)
and [AWS checksum settings](https://docs.aws.amazon.com/sdkref/latest/guide/feature-dataintegrity.html).

Both `/api/delete-file` and `/api/cleanup-unsubmitted-files` require a verified
user. Cleanup validates every key before deleting any object and refuses files
referenced by songs, PDFs, playlists, profiles, journey covers, seasons, source
URLs, or important-date photos. Unload beacons use the same-site cookie. Image
replacement uploads and commits the new reference first; older files may be
retained rather than risking loss during a failed replacement.

Song deletion commits its authorized PostgreSQL transaction before any storage
cleanup, refreshes coverage after commit, and retains objects still referenced
by other content. A failed database transaction never deletes files from S3.

`lib/song-scripture.ts` synchronizes the denormalized verse coverage arrays and
translation/genre JSON with `song_verses` when song metadata or scripture
connections change. Both historical database import paths share one pool.

`lib/database-config.js` resolves a complete legacy PG configuration before
`DATABASE_URL`, then the legacy `NEON_DATABASE_URL`. Knex resolves it lazily, allowing
secret-free builds while refusing an unspecified runtime database. Existing URL
SSL options are left to pg; external URLs without them use verified TLS unless explicitly
configured through `PGSSL`/`PGSSLMODE`. Known local Helium/loopback hosts and
reserved local hostname suffixes use non-SSL connections, without relying on
`NODE_ENV`. Original PG configuration retains its
existing default. The chapters API and targeted deployment script use this same
configuration and do not create a separate database target.

## Private resources and restored actions

Private playlists and PDFs are visible to their owners. Private PDF comments,
ratings, and notes honor the resource's visibility. Note reads and deletes are
restricted to their author. Authenticated journey owners may export their
private journey and hidden seasons; other viewers can only export public,
visible material. Journey exports retain existing source URLs.

PDF notes now have handlers for GET/POST `/api/pdfs/{id}/notes` and DELETE
`/api/pdfs/{id}/notes/{noteId}` using the existing `pdf_notes` table.
PATCH `/api/forum/topics/{id}/lock` restores the existing moderator action.
Locked topics reject new comments and replies. Locking and comment insertion
serialize on the topic row so a concurrent reply cannot bypass a completed lock.

The additive migration `20261013000001_add_forum_topic_lock.js` creates
`forum_topics.is_locked` only if it is absent. Its rollback retains moderation
state. It was not applied during local development. Check the deployment schema
and apply this specific migration if necessary; do not replay historical
migrations as a deployment shortcut. Earlier checked-in migrations are not a
reliable fresh-database bootstrap (the 202310 migration alters tables created in
202403, and a 202409 migration edits migration history).

Use `node scripts/apply-forum-topic-lock.mjs` to inspect the configured database
without changing it. Once its identity has been independently verified, run
`node scripts/apply-forum-topic-lock.mjs --apply --expect-database <verified-name>`.
The script checks the target and existing forum columns, invokes only this
specific migration in a transaction, and verifies the added column. If already
present, it makes no change. It never replays the historical migration chain,
edits migration-history rows, updates existing content, or drops anything.

The live PDF notes column is `note`, which the notes API and existing client
already use. Existing notes keep their IDs and text; no PDF notes migration or
content-column adapter is required.

## Verification

`tests/security.test.cjs` runs real TypeScript handlers with in-memory database
and storage mocks. It covers bearer/cookie/Google identity, forged and expired
tokens, current ownership, same-origin writes, cookie lifecycle, Auth.js form
encoding and multiple cookies, upload limits, key normalization, committed-file
protection, deletion rollback, moderator permissions, locked replies, and
private note isolation. It never accesses a deployed database, S3, or email.
These tests complement deployment testing of real authentication, upload CORS,
database schema, and storage permissions.

The legacy POST `/api/users/{id}/songs` now delegates to the canonical song
submission route, accepts either a `genres` array or the old `genre` string, and
returns `201 { id }`. It requires the same valid duration, metadata, owned
stored upload, and scripture rules as `/api/submit-song`.
