# Song Shuffle Feature Fix

## Problem Description
The song shuffle feature was only shuffling songs that had already been loaded into the UI, not all songs that matched the current search criteria or playlist selection. Additionally, when filters or playlist selection changed while shuffle was active, the shuffle queue was not updated to reflect the new criteria.

## Root Causes Identified

1. **Limited Song Pool**: Shuffle only worked with songs currently loaded in the UI (typically 20-40 songs due to pagination), not all songs matching the filters/playlist.

2. **No Dynamic Updates**: When users changed filters or selected different playlists while shuffle was active, the shuffle queue remained unchanged, playing from the old set of songs.

3. **Inconsistent Queue Management**: The queue wasn't properly shuffled when updated programmatically, and turning shuffle off didn't restore the original order.

## Fixes Implemented

### 1. Dynamic Shuffle Queue Updates (`pages/listen.tsx`)

**Added new useEffect to monitor filter/playlist changes:**
```typescript
// Update shuffle queue when filters or playlist change while shuffle is active
useEffect(() => {
  if (isShuffling) {
    fetchAllSongs()
      .then((all) => {
        const shuffledSongs = all.map(toPlayerSong)
        // Only update if we actually have songs that match the current criteria
        if (shuffledSongs.length > 0) {
          updateQueue(shuffledSongs)
        }
      })
      .catch((err) => console.error('Error updating shuffle queue after filter/playlist change:', err))
  }
}, [isShuffling, debouncedFilters, selectedPlaylist, fetchAllSongs, updateQueue, toPlayerSong])
```

**Optimized toPlayerSong function:**
- Wrapped with `useCallback` to prevent unnecessary re-renders
- This ensures the dependency array works correctly

### 2. Enhanced Queue Management (`contexts/MusicPlayerContext.tsx`)

**Improved updateQueue function:**
```typescript
const updateQueue = (newQueue: MusicPlayerSong[]) => {
  // If shuffle is active, shuffle the new queue
  const queueToSet = isShuffling ? shuffleArray(newQueue) : newQueue;
  setQueue(queueToSet);
  if (currentSong) {
    const newIndex = queueToSet.findIndex((s) => s.id === currentSong.id);
    if (newIndex !== -1) {
      setCurrentIndex(newIndex);
    } else if (queueToSet.length > 0) {
      // If current song is not in the new queue, reset to first song but don't auto-play
      setCurrentIndex(0);
    }
  }
};
```

**Enhanced shuffle toggle functionality:**
```typescript
const toggleShuffle = async () => {
  if (!isShuffling && shuffleLoaderRef.current) {
    // Enabling shuffle - load and shuffle all songs
    try {
      const allSongs = await shuffleLoaderRef.current();
      const shuffled = shuffleArray(allSongs);
      setQueue(shuffled);
      if (currentSong) {
        const idx = shuffled.findIndex((s) => s.id === currentSong.id);
        if (idx !== -1) setCurrentIndex(idx);
      }
    } catch (err) {
      console.error('Error loading songs for shuffle:', err);
    }
  } else if (isShuffling && shuffleLoaderRef.current) {
    // Disabling shuffle - restore original order
    try {
      const allSongs = await shuffleLoaderRef.current();
      setQueue(allSongs); // Set unshuffled queue
      if (currentSong) {
        const idx = allSongs.findIndex((s) => s.id === currentSong.id);
        if (idx !== -1) setCurrentIndex(idx);
      }
    } catch (err) {
      console.error('Error loading songs for unshuffle:', err);
    }
  }
  setIsShuffling(!isShuffling);
};
```

## Key Improvements

1. **Complete Song Pool**: Shuffle now works with ALL songs matching current filters/playlist, not just loaded ones
2. **Real-time Updates**: Changing filters or playlists while shuffle is active immediately updates the shuffle queue
3. **Proper Queue Management**: Queue is automatically shuffled when updated during shuffle mode
4. **Consistent Behavior**: Turning shuffle off restores the original (unshuffled) order
5. **Error Handling**: Added proper error handling for edge cases
6. **Performance**: Optimized with useCallback to prevent unnecessary re-renders

## User Experience Impact

- **Before**: Users could only shuffle through 20-40 songs that were visible on screen
- **After**: Users can shuffle through hundreds or thousands of songs matching their criteria
- **Before**: Changing filters while shuffle was active had no effect on the shuffle queue
- **After**: Filter changes immediately update the shuffle queue with new matching songs
- **Before**: Shuffle queue remained in shuffled order even when shuffle was disabled
- **After**: Disabling shuffle restores the original sorted order

## Testing Scenarios

The fix handles these scenarios properly:
1. Enable shuffle → All matching songs are shuffled
2. Change filters while shuffle is active → Queue updates with new filtered songs
3. Select different playlist while shuffle is active → Queue updates with playlist songs
4. Disable shuffle → Original order is restored
5. Current song not in new filtered results → Gracefully handles the transition

This comprehensive fix ensures the shuffle feature works as users would expect in a modern music player application.