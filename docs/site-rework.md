# BibleChorus site rework

The rework keeps the Pages router, PostgreSQL records, AWS S3 objects, existing IDs and URLs, and all music, community, study, profile, and journey workflows. The previous implementation remains recoverable in Git at `bc43cc7860511f379b3d1e95033f4d06937510d3`.

## Experience and structure

- One responsive application shell with grouped navigation, real links, current-page states, a keyboard skip link, and a focus-managed mobile drawer.
- A shared parchment/bronze and warm charcoal palette, typography, cards, forms, and reduced-motion support in `styles/globals.css`. Existing inline styles use `lib/design-system.ts`; new components use Tailwind tokens.
- Homepage community figures and recent songs come from the existing APIs. Failed requests show retry controls instead of misleading zero counts.
- Music discovery keeps every existing filter, sort, compact/detail mode, playlist control, rating/comment action, and playback action. Reading, filtering, and background requests no longer obscure the app with a blocking full-screen spinner.
- Journey browse, reader, and editor retain seasons, songs, dates, privacy, custom accents, ordering/layout, photos, source links, lyrics/scripture, likes, exports, and NotebookLM links. `JourneySplitPanel` holds music beside its reflection. Original-source uploads are a later feature; this change adds neither invented source content nor a source database migration.
- The player keeps explicit queue occurrence identity, shuffle/load-all support, repeat modes, seeks, media-session controls, lyrics/scripture comparison, menus, and minimized playback. Autoplay/network failures have useful feedback. Route changes retain playback.
- Authentication restores legacy bearer sessions and Google sessions through a server-verified bootstrap. API-only authorization headers are never forwarded to S3 or external services. Logout clears both legacy and OAuth sessions. Forms honor a validated internal return destination.
- One shared query client and database pool replace duplicate instances. Third-party icon and toast types use their real package declarations.

## Data protection

`Reference/api_security_reference.md` documents the shared authentication and ownership boundary. Identity comes from the verified session, rather than supplied user IDs. Cleanup can only remove the current user's unsubmitted objects and refuses references held by saved content. Replacement flows retain prior artwork; deletion commits database work before storage cleanup. Private PDF notes are isolated by account and PDF. Private playlists/PDFs require owner access. Uploads are verified against S3 metadata before submission.

The added moderator lock migration is additive and idempotent. Check whether the live database already contains `forum_topics.is_locked`. If it does not, apply **only** `20261013000001_add_forum_topic_lock.js` through a reviewed deployment step. Do not run the entire historical migration chain: old migrations include inconsistent ordering and destructive history changes. No migrations, seeds, deletions, or data resets are part of installation/build/start.

## Verification and deployment

Run `npm ci`, `npm run check`, and `npm run build`. Tests run offline with mocked authentication/database/storage boundaries; they never touch production content. GitHub CI and Replit use Node 22 LTS, matching the patched sanitizer's runtime requirement.

For local visual inspection with existing public data, run the built app on port 5080 and `node scripts/read-only-preview.mjs`; open port 4100. The QA proxy strips credentials and blocks mutations. It is not the production server and must never be used as a deployment command. Local SSR routes that require PostgreSQL need separate environment verification in Replit.

Replit builds with `npm run build` and runs `npm run start`. The standard Next.js server output matches that command. No server secrets are declared in Next.js's client-inlining `env` option. Runtime needs the existing PG variables, JWT/NEXTAUTH secret, AWS/CloudFront configuration, Google OAuth configuration, and SendGrid configuration.

Sync GitHub source into Replit without generated edits, preserve unrelated workspace changes, verify the supplied commit, and publish only a validated workspace snapshot. GitHub pushes alone do not establish a new production deployment. Compare public API health, existing record counts, metadata, and media delivery after deployment. Provider backup policies and preview data isolation are separate operational settings, not established by Git history.

## Known dependency maintenance

The initial audit reported 52 advisories, including five critical. Compatible updates and removal of unused libraries eliminated the critical findings. The latest audit still reports advisories in CSS/glob build tooling, Next.js's bundled PostCSS, and rich-text HTML export. Those require upstream or major dependency changes; server sanitization remains enforced for rich text. A forced dependency downgrade or untested major Tailwind/Next migration is not part of this release. Review the lockfile and current advisories during follow-up dependency work.

### Braces stack-exhaustion mitigation

`braces@3.0.3` fixes CVE-2024-4068 but remains affected by
[GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
That advisory currently covers every published version through 3.0.3 and lists
no patched release. The locked consumers are Tailwind's chokidar/micromatch and
the Next ESLint plugin's fast-glob. Replacing them requires a larger migration.
Production installs retain the package through Tailwind peer dependencies, so the
patch installer is a regular dependency and also works with `npm ci --omit=dev`.
Source inspection found no application imports or request routes accepting brace
patterns; the observed consumers process CSS/content paths during build and
development. This exposure assessment does not establish advisory resolution.

`patches/braces+3.0.3.patch` applies a local, immutable limit of 100 nested
brace/parenthesis blocks and bounds recursive AST walkers and expansion parent
chains. Ordinary glob/list/range behavior is retained; deeper patterns fail with
a controlled `SyntaxError`. `patch-package --error-on-fail` applies the patch
after installation. The dev/build/start commands verify the exact installed
patched sources and lockfile resolution before invoking Next, including when
npm lifecycle scripts were skipped. Dependency updates or additional braces
copies require reviewing the patch and verifier together. Security regression
tests exercise bounded reproducers, depth boundaries, AST cycles and real glob
consumers without live credentials or data changes.

The package keeps its genuine 3.0.3 version, registry URL and integrity. This is a
runtime mitigation, **not** an official patched release or proof that Dependabot
alert #241 is closed. npm audit and Dependabot may continue to report it; do not
dismiss the alert solely because tests or a deployment pass. Remove this backport
only after verifying a supported upstream fix or removal of the dependency.
