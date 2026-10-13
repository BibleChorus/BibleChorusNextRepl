# Journey Originals

Creators can attach original recordings, journal text, images, and PDFs to a saved journey song entry (`journey_season_songs.id`). Existing reflections, source hyperlinks (including OneDrive), milestones, and music-library songs keep their meaning and data. No transcription or automatic AI transmission is introduced.

## Experience and privacy

The Originals editor supports add, label, edit, keyboard reorder, preview, remove, and explicit sharing. Journals are plain text (50,000 characters); labels allow 120 characters; each entry allows 20 originals. Previews load on demand. The existing split panel puts originals beside the song on desktop and below it on mobile, using shared parchment/bronze and warm charcoal tokens.

Every new original starts private, including in a public journey. A non-owner can read it only while it is ready and explicitly shared, the journey is public, the season is visible, and its owner matches the season owner. Owners can read pending/private material. Current database state controls metadata, journal details, file delivery, and exports.

Unsharing, changing a journey to private, hiding a season, or removing an original/entry blocks subsequent requests. Previously received copies cannot be recalled; an already authorized stream may finish. Every new byte-range request rechecks authorization. Responses use `Cache-Control: private, no-store`, and reverse proxies must not cache them.

Files use only `/api/journeys/originals/{id}/file`, never public CloudFront, unsigned S3, or presigned read URLs. Metadata/detail/export responses contain no bucket/object keys. The owner's short-lived PUT envelope necessarily contains the private pending upload destination, with write access only. Images bypass Next's shared image optimizer. Native media uses the existing HttpOnly session cookie; bearer authentication remains supported without URL tokens.

Starting original audio pauses the main player and other originals. Starting the main player pauses originals. The main queue and both listening positions are retained during comparison; preview teardown releases media listeners. `Copy for AI` excludes originals by default. Explicit opt-in includes only accessible originals; owners can include private journals after reviewing them before pasting into another service. File exports contain protected application paths and metadata, never bytes/credentials. Existing source links retain their established export behavior.

## API

Mutations use shared session/same-origin helpers, strict schemas, and parent-entry locks. Body-supplied owner IDs never authorize a write.

| Route | Contract |
| --- | --- |
| `GET /api/journeys/originals?entryId={entryId}` | Accessible metadata and `{ storage: { enabled, message? } }`. |
| `POST /api/journeys/originals` | `{ requestId, entryId, kind, label, journal_text }`, or `{ requestId, entryId, kind, label, file_name, mime_type, byte_size }`; private journal/pending file. |
| `GET /api/journeys/originals/{id}` | Fresh authorized details for an opened journal/editor. |
| `PATCH /api/journeys/originals/{id}` | Label, journal text, or explicit `is_shared`; pending files cannot be shared. |
| `DELETE /api/journeys/originals/{id}` | Remove the owned attachment record, never the finished song. |
| `POST /api/journeys/originals/reorder` | `{ entryId, originalIds }`, a complete unique permutation. |
| `POST /api/journeys/originals/{id}/upload-url` | Renew an owned pending PUT URL. |
| `POST /api/journeys/originals/{id}/finalize` | Validate stored bytes and mark ready. |
| `GET/HEAD /api/journeys/originals/{id}/file` | Authorized file delivery; Range supports seeking. |
| `GET /api/journeys/export-for-llm?username=…&includeOriginals=true` | Opt-in accessible originals; omit flag for the established export shape. |

## Upload validation and recovery

Supported audio: MP3, WAV, Ogg, M4A/MP4 audio, FLAC (200 MB); images: JPEG/PNG/WebP (5 MB); PDF: 10 MB. Client/server share MIME and size rules. Actual S3 length, MIME, and format signature are validated. SVG, HTML, executable/unsupported types, invalid names, and oversized files are rejected.

A pending reservation remains private through cancellation, disconnection, or failed finalization. PUT URLs expire after 15 minutes and sign type/length. Retry renews the same reservation; after reload reselect the same file or discard it. The separate Check completed upload action recovers a successful transfer whose response was lost. PUT restarts the transfer; byte-level multipart resume is not implemented. Private journal/file contents are not stored in local storage.

Each create request carries a UUID retained for that draft through interrupted responses. The database stores an internal owner-scoped request ID and digest of the initial material. An exact retry returns the same record even after later edits; reusing the ID with different material returns a conflict. Neither internal value is projected to viewers or exports. Cancelling a draft starts a new intent, while any already saved original remains discoverable in the list.

Finalization reads the pending object's ETag and conditionally copies the verified version to a new immutable ready key. An old PUT URL cannot overwrite a ready original. Pending cleanup is best effort after database commit. Ready objects may be retained when safe deletion is uncertain; record removal makes them inaccessible. Review pending-object lifecycle and ready retention before enabling files. Never expire ready material without an approved retention policy.

## Private storage prerequisite

The public-media bucket is not established as safe for private originals. Binary uploads are disabled by default; journals need only the additive table. `JOURNEY_ORIGINALS_BUCKET` must be independently verified and distinct from `AWS_S3_BUCKET_NAME`. `JOURNEY_ORIGINALS_STORAGE_VERIFIED=true` is an operator attestation, not a bypass. No bucket, credentials, service, policy, CORS rule, or permission is created by this PR. Existing credentials are reused only when already authorized. Missing prerequisites require approval for the exact infrastructure/cost/access change before enabling files.

Before signing, finalizing, and serving, runtime checks require all four S3 Block Public Access controls, `BucketOwnerEnforced`, nonpublic policy status, and an absent bucket policy or only Deny statements. Any resource-based Allow, including CloudFront OAC, is rejected. Missing read permission fails closed. Independently verify before setting the attestation:

- Bucket/account identity, existing identity-based app access, access-point policies, cross-account delegation, and all alternate routes/distributions. Anonymous S3/public-CDN access must deny originals. Do not expand permissions to make checks pass.
- Existing metadata operations (`GetPublicAccessBlock`, `GetBucketPolicyStatus`, `GetBucketPolicy`, `GetBucketOwnershipControls`) and object operations (`HeadObject`, bounded `GetObject`, `PutObject`, `CopyObject`, pending-only `DeleteObject`). Copy requires source read and destination write, not an IAM `s3:CopyObject` action. SDK `GetPublicAccessBlock` uses IAM `s3:GetBucketPublicAccessBlock`.
- CORS for precise approved app origins, PUT, and Content-Type. Direct PUT receives no app bearer header; do not add wildcard origins as a shortcut.
- Encryption, retention, versioning/object-lock, billing, and backups. Source development does not establish or change provider settings.

Nonpublic policy status alone does not exclude authenticated CloudFront access. See [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html#access-control-block-public-access-policy), [CloudFront OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html), and [S3 API permissions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-policy-actions.html).

## Schema and approved rollout

`20261013000002_create_journey_originals.js` adds only the originals table, ownership foreign keys, indexes, unique storage keys, and privacy/payload checks. Existing content/migration history is untouched. Rollback retains originals. Install/build/start never migrate.

Read-only inspection: `node scripts/apply-journey-originals.mjs`. After independent target identification and approval: `node scripts/apply-journey-originals.mjs --apply --expect-database <verified-name>`. This applies only the new migration in a transaction; incomplete existing schemas are refused. Never replay historical migrations.

After review and approved merge:

1. Record the actual merged GitHub main SHA and tree; squash merges differ from the draft commit.
2. Inspect Replit HEAD, branch, changes, and divergence read-only. Preserve intervening work in a recoverable snapshot and promote useful source edits through GitHub before alignment. Avoid destructive reset/clean.
3. Apply the targeted additive table migration to the independently verified database before the new code serves journey reads. Keep binary storage disabled until separately verified/approved.
4. Align Replit with approved merged SHA; require identical HEAD/tree, clean tracked status, and zero ahead/behind. Verify Publishing uses the unchanged tracked `.replit` commands.
5. Run `npm ci`, `npm run check`, and `npm run build` with the braces patch/verifier intact. Resolve package-firewall dependency failures without undoing that mitigation. In preview verify real auth/cookie file delivery, CORS, upload interruption, transitions, and exports.
6. Prepare Republish for the user after validation. Do not publish or automatically retry a prior failed publication. After user publication, verify behavior and preserved records.

For a clean Replit checkout with no local commits, synchronization can use
`git fetch origin main`, `git switch main`, and `git merge --ff-only origin/main`.
Stop on any changed files, divergence, or an unexpected main revision and preserve
that work before continuing. After alignment, compare `git rev-parse HEAD` to the
approved merged SHA and compare `git rev-parse 'HEAD^{tree}'` with
`git rev-parse 'origin/main^{tree}'`. Require empty `git status --porcelain`,
`git diff --exit-code HEAD`, and `git rev-list --left-right --count
HEAD...origin/main` returning `0 0`. Source parity is required in addition to
successful checks; neither a matching branch name nor a successful build proves it.

## Verification limits

Offline handler/storage tests use synthetic fixtures and no live credentials. Interaction tests cover audio handoff and repeated mount/unmount. Record actual passed/failed/unrun checks in the PR. Browser review must separately include 360px and desktop, both themes, keyboard/screen-reader controls, PDF/audio, and upload recovery. Mocks do not establish provider privacy/CORS, Replit parity, or publication readiness.
