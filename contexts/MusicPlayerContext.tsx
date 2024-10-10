import React, { createContext, useState, useContext, useRef, useEffect } from 'react';

// Define the Song type
type Song = {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  coverArtUrl?: string;
  duration?: number;
  // Add other song properties as needed
};

type MusicPlayerContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  pause: () => void;
  resume: () => void;
  // ... additional controls like next, previous, etc.
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... existing code ...
  {{
    // State for current song and playback status
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Ref for the audio element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Play a new song
    const playSong = (song: Song) => {
      setCurrentSong(song);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = song.audioUrl;
        audioRef.current.play();
      }
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
        // ... add other handlers like 'nexttrack', 'previoustrack' if needed
      }
    }, [currentSong, resume, pause]);

    return (
      <MusicPlayerContext.Provider
        value={{
          currentSong,
          isPlaying,
          playSong,
          pause,
          resume,
          // ... other controls
        }}
      >
        {children}
        {/* Hidden audio element */}
        <audio ref={audioRef} />
      </MusicPlayerContext.Provider>
    );
  }}
  // ... existing code ...
};

// Custom hook to use the music player context
export const useMusicPlayer = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};