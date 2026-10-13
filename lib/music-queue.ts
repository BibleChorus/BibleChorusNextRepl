/** Fisher–Yates preserves every queue entry, including deliberate repeated songs. */
export function shuffleSongs<T>(
  songs: readonly T[],
  random = Math.random,
): T[] {
  const shuffled = [...songs];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

/** Prefer the selected entry over its ID, because a playlist can contain a song twice. */
export function findSongIndex<T extends { id: number }>(
  songs: readonly T[],
  song: T | null,
  preferredIndex = -1,
): number {
  if (!song) return -1;
  if (preferredIndex >= 0 && songs[preferredIndex] === song)
    return preferredIndex;
  const sameEntry = songs.indexOf(song);
  return sameEntry >= 0
    ? sameEntry
    : songs.findIndex((entry) => entry.id === song.id);
}

/** Anchor one selected entry, then shuffle the remaining entries without dropping repeats. */
export function shuffleWithCurrent<T extends { id: number }>(
  songs: readonly T[],
  current: T | null,
  preferredIndex = -1,
  random = Math.random,
): T[] {
  const index = findSongIndex(songs, current, preferredIndex);
  if (!current || index < 0) return shuffleSongs(songs, random);
  return [
    current,
    ...shuffleSongs(
      songs.filter((_, entryIndex) => entryIndex !== index),
      random,
    ),
  ];
}

export function nextSongIndex(
  length: number,
  current: number,
  direction: 1 | -1,
  repeatAll: boolean,
): number | null {
  if (!Number.isInteger(length) || length <= 0) return null;
  // A playing song can remain outside a replaced queue. Next starts the new queue.
  if (!Number.isInteger(current) || current < 0 || current >= length)
    return direction === 1 ? 0 : repeatAll ? length - 1 : null;
  const index = current + direction;
  if (index >= 0 && index < length) return index;
  return repeatAll ? (index + length) % length : null;
}
