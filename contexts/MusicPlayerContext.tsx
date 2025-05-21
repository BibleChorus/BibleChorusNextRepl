import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios'; // Import axios for API calls

// Define the MusicPlayerSong type
interface MusicPlayerSong {
  id: number;
  title: string;
  artist?: string;
  audioUrl: string;
  coverArtUrl?: string;
  duration?: number;
  lyrics?: string;
  bible_verses?: { book: string; chapter: number; verse: number }[];
  bible_translation_used?: string;
  uploaded_by: number;
  audio_url: string; // Added to match the usage in FloatingMusicPlayer
}

type RepeatMode = 'none' | 'one' | 'all';

import { useFilters } from './FilterContext'; // Import useFilters

// Add this to your MusicPlayerContext file
interface MusicPlayerContextType {
  currentSong: MusicPlayerSong | null;
  isPlaying: boolean;
  playSong: (song: MusicPlayerSong, queue?: MusicPlayerSong[], playlistIdContext?: string | null) => void; // Updated signature
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  isShuffling: boolean;
  repeatMode: RepeatMode;
  queue: MusicPlayerSong[];
  audioElement: HTMLAudioElement | null;
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  // ... additional controls
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { filters: globalFilters, activePlaylistId: globalActivePlaylistId, setActivePlaylistId: setGlobalActivePlaylistId } = useFilters();

  // State for the playlist (queue) and playback controls
  const [queue, setQueue] = useState<MusicPlayerSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<MusicPlayerSong | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  // Removed local activePlaylistId and activeFilters states (they are now consumed from FilterContext)

  // Ref for the audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State to track if play count has been incremented for the current song
  const [hasIncrementedPlayCount, setHasIncrementedPlayCount] = useState<boolean>(false);

  // Function to increment play count
  const incrementPlayCount = async (songId: number) => {
    try {
      await axios.post(`/api/songs/${songId}/increment-play-count`);
      setHasIncrementedPlayCount(true);
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  };

  // Watch for playback progress to increment play count after a certain duration
  useEffect(() => {
    if (audioRef.current && currentSong) {
      const audioElement = audioRef.current;

      const handleTimeUpdate = () => {
        const playedPercentage = (audioElement.currentTime / (currentSong.duration || 0)) * 100;
        // Adjust the percentage or time threshold as needed
        if (!hasIncrementedPlayCount && playedPercentage > 30) {
          incrementPlayCount(currentSong.id);
        }
      };

      audioElement.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [audioRef, currentSong, hasIncrementedPlayCount]);

  // Reset hasIncrementedPlayCount when the song changes
  useEffect(() => {
    setHasIncrementedPlayCount(false);
  }, [currentSong]);

  // Helper function to fetch all songs for shuffle
  const fetchAllSongsForShuffle = async (params: { playlistId?: string | null; filters?: Record<string, string> | null }): Promise<MusicPlayerSong[]> => {
    let apiUrl = '/api/songs?limit=10000'; // Default to fetching all songs with a large limit

    if (params.playlistId) {
      apiUrl = `/api/songs?playlist_id=${params.playlistId}&limit=10000`;
    } else if (params.filters) {
      // Assuming filters is an object like { genre: 'Rock', artist: 'ArtistName' }
      const queryParams = new URLSearchParams(params.filters).toString();
      apiUrl = `/api/songs?${queryParams}&limit=10000`;
    }

    try {
      const response = await axios.get(apiUrl);
      // Assuming the API returns an object with a 'songs' array or the array directly
      return response.data.songs || response.data || [];
    } catch (error) {
      console.error('Error fetching songs for shuffle:', error);
      return [];
    }
  };

  // Play a new song (optionally with a new queue and playlist context)
  const playSong = (song: MusicPlayerSong, newQueue?: MusicPlayerSong[], playlistIdContext?: string | null) => {
    if (playlistIdContext !== undefined) { // Can be null to clear playlist context, undefined means not specified
      setGlobalActivePlaylistId(playlistIdContext);
    }

    if (newQueue) {
      setQueue(newQueue);
      const newIndex = newQueue.findIndex((s) => s.id === song.id);
      setCurrentIndex(newIndex !== -1 ? newIndex : 0); 
    } else {
      setCurrentIndex((prevIndex) => {
        const index = queue.findIndex((s) => s.id === song.id);
        if (index !== -1) {
          return index;
        } else {
          setQueue([...queue, song]);
          return queue.length;
        }
      });
    }
    setCurrentSong(song);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.play();
    }

    // Increment play count when a new song starts playing
    incrementPlayCount(song.id);
  };

  // Pause playback
  const pause = () => {
    setIsPlaying(false);
    audioRef.current?.pause();
  };

  // Resume playback
  const resume = () => {
    setIsPlaying(true);
    audioRef.current?.play();
  };

  // Play next song
  const next = () => {
    if (isShuffling) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentIndex(randomIndex);
      setCurrentSong(queue[randomIndex]);
      if (audioRef.current) {
        audioRef.current.src = queue[randomIndex].audioUrl;
        if (isPlaying) audioRef.current.play();
      }
    } else {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // Stop playback at the end of the queue
          setIsPlaying(false);
          return;
        }
      }
      setCurrentIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
      if (audioRef.current) {
        audioRef.current.src = queue[nextIndex].audioUrl;
        if (isPlaying) audioRef.current.play();
      }
    }
  };

  // Play previous song
  const previous = () => {
    if (isShuffling) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentIndex(randomIndex);
      setCurrentSong(queue[randomIndex]);
      if (audioRef.current) {
        audioRef.current.src = queue[randomIndex].audioUrl;
        if (isPlaying) audioRef.current.play();
      }
    } else {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = queue.length - 1;
        } else {
          // Already at the start of the queue
          return;
        }
      }
      setCurrentIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      if (audioRef.current) {
        audioRef.current.src = queue[prevIndex].audioUrl;
        if (isPlaying) audioRef.current.play();
      }
    }
  };

  // Toggle shuffle mode
  const toggleShuffle = async () => {
    const newShuffleState = !isShuffling;
    setIsShuffling(newShuffleState);

    if (newShuffleState) {
      let songsForShuffle: MusicPlayerSong[] = [];
      // Use globalActivePlaylistId from FilterContext first
      if (globalActivePlaylistId) {
        songsForShuffle = await fetchAllSongsForShuffle({ playlistId: globalActivePlaylistId });
      } else if (globalFilters && Object.keys(globalFilters).length > 0) {
        // Then use globalFilters from FilterContext
        // Ensure globalFilters is compatible with fetchAllSongsForShuffle's expected type.
        // FilterCriteria might need to align or cast here.
        songsForShuffle = await fetchAllSongsForShuffle({ filters: globalFilters as Record<string, string> });
      } else {
        // Fallback: If no specific context, shuffle all songs from the library
        // This assumes the default fetchAllSongsForShuffle (no params) gets all songs.
        // Alternatively, could shuffle the existing queue if that's preferred when no context.
        songsForShuffle = await fetchAllSongsForShuffle({});
      }

      if (songsForShuffle.length > 0) {
        const currentSongId = currentSong?.id;
        setQueue(songsForShuffle);

        let newCurrentIndex = -1;
        if (currentSongId !== undefined) {
          newCurrentIndex = songsForShuffle.findIndex(song => song.id === currentSongId);
        }

        if (newCurrentIndex !== -1) {
          setCurrentIndex(newCurrentIndex);
          // If current song is in the new queue, ensure it's loaded if not playing
          // or if audio source needs update. playSong handles this.
          // However, calling playSong directly might restart it if already playing.
          // For now, setting currentSong and letting useEffects handle it.
          setCurrentSong(songsForShuffle[newCurrentIndex]);
          if (audioRef.current && audioRef.current.src !== songsForShuffle[newCurrentIndex].audioUrl) {
             audioRef.current.src = songsForShuffle[newCurrentIndex].audioUrl;
             if(isPlaying) audioRef.current.play().catch(e => console.error("Error playing audio:", e));
          }

        } else {
          // Current song is not in the new queue, or no current song. Play the first song.
          setCurrentIndex(0);
          setCurrentSong(songsForShuffle[0]); // Set current song to the first in new queue
          // Call playSong to correctly initialize playback with the new song and queue
          // playSong will also set the audio source and play if isPlaying is true.
          // Pass the new queue to playSong to ensure its internal queue state is also updated.
          playSong(songsForShuffle[0], songsForShuffle);
        }
      } else {
        // No songs returned for shuffle (e.g., empty playlist, or API error handled by fetchAllSongsForShuffle)
        // Optionally, revert isShuffling state or keep current queue.
        // For now, if shuffle is enabled but no songs, it will just be an empty queue.
        setQueue([]);
        setCurrentSong(null);
        setCurrentIndex(0);
        if (isPlaying) {
          pause(); // Pause if playing and queue becomes empty
        }
      }
    }
    // If turning shuffle off (newShuffleState is false), the queue remains as the full shuffled list.
    // The user can navigate or select a new playlist/filters to get a different queue.
    // Or, one could implement logic here to revert to a "pre-shuffle" queue if needed.
  };

  // Toggle repeat mode
  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  // Handle song end event
  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current;
      const handleEnded = () => {
        if (repeatMode === 'one') {
          audioElement.currentTime = 0;
          audioElement.play();
        } else {
          next();
        }
      };
      audioElement.addEventListener('ended', handleEnded);
      return () => {
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [next, repeatMode]);

  // Media Session API integration
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: [
          {
            src: currentSong.coverArtUrl || '/default-cover.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', resume);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('previoustrack', previous);
    }
  }, [currentSong, resume, pause, next, previous]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playSong,
        pause,
        resume,
        next,
        previous,
        toggleShuffle,
        toggleRepeat,
        isShuffling,
        repeatMode,
        queue,
        audioElement: audioRef.current, // Expose audio element
        isMinimized,
        setIsMinimized,
        // ... other controls
      }}
    >
      {children}
      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};