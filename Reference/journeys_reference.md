# Journeys: presentation and data contracts

Journeys collect existing songs, personal reflections, scripture, and important dates into seasons of a creator's life. The 2026 interface refresh changes presentation and client behavior without migrating, deleting, or moving journey data.

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

## Future original-source comparison

The user plans to add uploads of the original music, journal, or other material that inspired a journey song. That upload feature is not implemented by the interface refresh. No source files, source records, placeholder data, migrations, or database columns are introduced.

Use `JourneySplitPanel.context` for the future source viewer alongside the finished song, keeping the existing reflection and source-link information available. An audio recording, journal text, image, or document can supply the context node without changing the playback panel. A dedicated comparison view can reuse the same layout with a wider context pane.

Before implementing uploads, define how a source belongs to a journey song entry, how multiple sources are ordered, and how it inherits the journey's privacy. Add a migration and documented API contract for that relationship instead of overloading `source_url` or changing the meaning of existing song audio. Preserve original source assets separately from the finished song, and reuse the established presigned upload and validation utilities. Keep source-media playback distinct from the finished-song queue.
