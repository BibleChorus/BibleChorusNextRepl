import React, { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  ListMusic,
} from 'lucide-react';
import Image from 'next/image';

export default function FloatingMusicPlayer() {
  // Access music player context
  const {
    currentSong,
    isPlaying,
    pause,
    resume,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    isShuffling,
    repeatMode,
    audioElement,
  } = useMusicPlayer();

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Update current time and duration
  useEffect(() => {
    if (audioElement) {
      const handleTimeUpdate = () => {
        setCurrentTime(audioElement.currentTime);
        setDuration(audioElement.duration || 0);
      };
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [audioElement]);

  // Handle time slider change
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(event.target.value);
    if (audioElement) {
      audioElement.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  // Format time in mm:ss
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60) || 0;
    const seconds = Math.floor(time % 60) || 0;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Hide the player if no song is selected
  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center">
          <div className="w-12 h-12 relative mr-3">
            <Image
              src={currentSong.coverArtUrl || '/default-cover.jpg'}
              alt={currentSong.title}
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          </div>
          <div>
            <div className="text-sm font-semibold">{currentSong.title}</div>
            <div className="text-xs text-muted-foreground">{currentSong.artist}</div>
          </div>
        </div>
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button onClick={toggleShuffle} className={`p-2 ${isShuffling ? 'text-primary' : ''}`}>
            <Shuffle className="w-5 h-5" />
          </button>
          <button onClick={previous} className="p-2">
            <SkipBack className="w-6 h-6" />
          </button>
          <button onClick={isPlaying ? pause : resume} className="p-2">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </button>
          <button onClick={next} className="p-2">
            <SkipForward className="w-6 h-6" />
          </button>
          <button onClick={toggleRepeat} className={`p-2 ${repeatMode !== 'none' ? 'text-primary' : ''}`}>
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && <span className="text-xs absolute -mt-5 ml-3">1</span>}
          </button>
        </div>
        {/* Progress Slider */}
        <div className="flex items-center w-1/3">
          <span className="text-xs mr-2 w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleTimeChange}
            className="w-full"
          />
          <span className="text-xs ml-2 w-10">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}