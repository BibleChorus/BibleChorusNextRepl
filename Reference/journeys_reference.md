# Journeys: presentation and data contracts

Journeys collect existing songs, personal reflections, scripture, and important dates into seasons of a creator's life. Journey Originals add private source attachments without moving or changing existing journey data.

## Routes and responsibilities

- `/journeys` browses public journeys, supports likes, and links to a creator's editor or public profile. It uses `/api/journeys/public` with the existing `limit` and `offset` contract. Search filters the loaded journeys; the interface states that scope and provides Load more.
- `/journeys/[username]` loads `/api/journeys/[username]`. The server determines whether the viewer can see a private journey and whether hidden seasons are included. Client ownership controls editor links and preview labels only; it never grants access.
- `/journeys/edit` loads the profile and seasons in parallel, then uses the existing profile, season, song, and important-date endpoints for edits. `/api/journeys/seasons` already returns songs and important dates, so a refresh does not need a separate request per season.
- Wait for `useAuth().isLoading` to finish before deciding whether a viewer must sign in or whether a private profile is accessible. Use `getAuthToken()` for existing authenticated request headers and preserve server-side cookie/session authorization.

## Preserved behavior

Season creation, editing, deletion, visibility, song selection, personal notes, source hyperlinks, important-date creation/editing/deletion, and photo upload continue to use the original endpoints. Deleting a season or removing its song entries does not delete the underlying songs from the music library. Important-date photos retain the existing 5 MB client limit and presigned upload workflow.

Journey profile settings retain title, subtitle, biography, public/private visibility, song-date visibility, play-count visibility, and NotebookLM. Cover image URL and `layout_style` controls expose fields already supported by the profile API. The public presentation honors `timeline`, `cards`, and `grid` layout values. Saved season theme colors remain visible as season accents.

Song playback uses the shared music player and passes a queue of the journey's songs in chronological season order. Pause/resume works through the same provider. Lyrics/scripture comparison, full artwork viewing, important-date photo viewing, external-source confirmation, AI export, and NotebookLM links remain available. Personal notes, origin metadata, and source controls are visible without requiring hover or a temporary touch state. Source URLs are displayed independently of whether an origin label exists. Only HTTP/HTTPS source links are opened by the client.

## Component structure

- `JourneyHero` renders the cover, creator, introduction, listen/share actions, biography, AI export, and NotebookLM tools.
- `JourneyTimeline` merges season songs and important dates by calendar date. Dates with the same day place the important date before a song; within one type, display order breaks ties.
- `JourneySong` renders playback, artwork, lyrics/scripture tools, optional play counts, and the song's existing context.
- `JourneySplitPanel` accepts separate `music` and `context` React nodes. On wide screens, the song and its reflection appear side by side; on smaller screens they stack. It has no persistence or upload assumptions.
- `JourneyImportantDate` keeps the date, description, and accessible photo viewer together.
- `PublicJourneyCard`, `SeasonForm`, `SongSelector`, and `JourneySettings` isolate browse cards and editor tasks.
- `journey-utils` centralizes media URL normalization, calendar-day parsing/formatting, duration formatting, player-song mapping, origin labels, and external-link validation.
- `JourneyTheme` retains the theme helper's public API while inheriting the site's shared design tokens. Journey pages no longer inject global body/container/sidebar overrides.

Calendar-only journey dates must be parsed as local calendar days rather than UTC timestamps. This prevents a stored date from appearing one day earlier in western time zones. Invalid or missing dates render without throwing. Song-search and scripture requests cancel when their input or dialog state changes, preventing stale responses from replacing a newer selection.

## Original-source comparison

`JourneyOriginalsEditor` attaches audio, plain-text journals, images, and PDFs to a saved `journey_season_songs.id`. Its controls add/edit labels, reorder by keyboard, preview, recover pending uploads, remove, and explicitly share. `JourneyOriginalsViewer` lives in `JourneySplitPanel.context` after the preserved reflection and external source link. Originals stack below music on mobile. Private previews never use public CDN/image-optimizer URLs.

Originals start private. All metadata/detail/file/export requests enforce ownership and current journey/season visibility. Bulk reads contain metadata; journal text and binary previews load on demand. Original audio pauses other streams without replacing the main queue or resetting listening positions. `JourneyHero` exports originals only after an explicit inclusion choice.

The additive `journey_originals` table is separate from finished songs and `source_url`. Its targeted migration is an approved deployment prerequisite, never a build action. Files fail closed until independently verified private storage is available; journals do not depend on S3. Read [the complete API, storage, privacy, recovery, and rollout contract](../docs/journey-originals.md) before changing these boundaries.
