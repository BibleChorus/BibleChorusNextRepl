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

// Add this to your MusicPlayerContext file
interface MusicPlayerContextType {
  currentSong: MusicPlayerSong | null;
  isPlaying: boolean;
  playSong: (song: MusicPlayerSong, queue?: MusicPlayerSong[]) => void;
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
  updateQueue: (newQueue: MusicPlayerSong[]) => void;
  // ... additional controls
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for the playlist (queue) and playback controls
  const [queue, setQueue] = useState<MusicPlayerSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<MusicPlayerSong | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

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

  const updateQueue = (newQueue: MusicPlayerSong[]) => {
    setQueue(newQueue);
    if (currentSong) {
      const newIndex = newQueue.findIndex((s) => s.id === currentSong.id);
      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
      }
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

  // Play a new song (optionally with a new queue)
  const playSong = (song: MusicPlayerSong, newQueue?: MusicPlayerSong[]) => {
    if (newQueue) {
      setQueue(newQueue);
      setCurrentIndex(newQueue.findIndex((s) => s.id === song.id));
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
  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
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
        updateQueue,
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