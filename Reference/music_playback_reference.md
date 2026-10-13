# Music playback and queue behavior

`contexts/MusicPlayerContext.tsx` owns one HTML audio element and exposes playback, queue, shuffle, repeat, minimized-player, and MediaSession controls. `lib/music-queue.ts` contains the pure ordering and navigation helpers. No queue change writes to the song or playlist database.

## Queue entries and selection

A playlist or journey may intentionally include the same song ID more than once. Each internal queue entry has a unique runtime key, and `currentIndex` identifies the selected occurrence. Navigation must use that index instead of searching by song ID.

`playSong(song, queue?, queueIndex?)` preserves existing callers. A supplied queue replaces the collection; a song missing from it is included. Without a supplied queue, an absent song is appended. Queue-row controls should pass their row index as the optional third argument so identical repeated objects select the right occurrence, and should use `currentIndex` for the active row.

`updateQueue(songs)` replaces the upcoming collection without interrupting the current audio. If the current song is absent, it keeps playing outside the new queue with index `-1`; Next starts the replacement's first entry. In shuffle mode, an included current entry remains first, and the other entries are shuffled. Input arrays are copied and never mutated.

Shuffle preserves every entry, including intentional repeats, and keeps the current selected occurrence at the front. Turning shuffle off restores the canonical order and that occurrence's index. Songs added while shuffled remain in the restored queue. The loader is invoked when enabling shuffle, not when disabling it. `registerShuffleLoader` returns a scoped disposer, which the collection page's effect must return on unmount. Concurrent requests coalesce, and a late loader result cannot replace a subsequently selected collection or survive disposal.

## Playback state and repeat

Native play/pause events drive `isPlaying`; rejected play promises, stream errors, and queue exhaustion leave it false. An attempt counter prevents a rejected older play request from pausing a newer song or surfacing a stale error. Moving forward or backward while paused loads the selected track without resuming it.

Previous restarts a track after three seconds; near its beginning it navigates backward. At the start of a nonrepeating queue it restarts the first track. Repeat modes cycle `none → all → one → none`. Repeat-all wraps queue boundaries; repeat-one restarts the current song on its natural end while explicit Next can still select another song.

Play-count analytics use the audio element's current positive, finite duration, falling back to the selected song's duration until metadata loads. Crossing 30 percent increments once per listen. Changing songs or starting another repeat-one listen resets that threshold guard. Analytics failures do not stop audio.

MediaSession publishes the current title, artist, artwork, playback state, and play/pause/next/previous actions. Unsupported metadata or actions do not break the player. Provider cleanup pauses the audio, releases its source, and clears MediaSession controls. Unknown journey uploader IDs must be shown as text rather than linking to `/profile?id=0`.

## Offline regression checks

Run:

```sh
node --import tsx --test tests/music-queue.test.cjs tests/music-player.test.cjs
```

The queue suite checks immutable permutations across multiple lengths and seeded random sources, duplicate-entry preservation, and navigation boundaries. The provider suite mounts the actual React component in the existing jsdom dependency with mocked native audio events, play promises, analytics, and MediaSession. It checks queue replacement, shuffle restoration and races, repeat modes, rejected/stale play attempts, current-song duration/count thresholds, and provider cleanup. These tests never request production audio, PostgreSQL, or network services. Real browser/audio verification remains a separate integration check.
