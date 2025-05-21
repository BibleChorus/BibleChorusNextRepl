import React, { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  X,
  Minimize2,
  Maximize2,
  BookOpenText,
  MoreVertical,
} from 'lucide-react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSidebar } from '@/contexts/SidebarContext';
import LyricsBibleComparisonDialog from '@/components/ListenPage/LyricsBibleComparisonDialog';
import Link from 'next/link';
import { SongOptionsMenu } from '@/components/SongOptionsMenu';
import { Song } from '@/types';

// Add a type for the music player song that includes optional properties
interface MusicPlayerSong extends Partial<Song> {
  id: number;
  title: string;
  artist?: string;
  coverArtUrl?: string; // Note: this matches the property name used in the component
  audio_url: string;
  uploaded_by: number;
}

export default function FloatingMusicPlayer() {
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
    queue,
    playSong,
    audioElement,
    isMinimized,
    setIsMinimized,
  } = useMusicPlayer();

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [isLyricsBibleDialogOpen, setIsLyricsBibleDialogOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 400px)');
  const { isOpen } = useSidebar();

  const leftOffset = isMobile ? 'left-0' : isOpen ? 'left-64' : 'left-16';

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

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(event.target.value);
    if (audioElement) {
      audioElement.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60) || 0;
    const seconds = Math.floor(time % 60) || 0;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    console.log('Current Song:', currentSong);
  }, [currentSong]);

  // Transform currentSong to match the Song interface
  const getSongForOptions = (song: MusicPlayerSong): Song => {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist || '',
      audio_url: song.audio_url,
      uploaded_by: song.uploaded_by,
      username: '', // Add default values for required Song properties
      genres: [],
      created_at: '',
      duration: 0,
      song_art_url: song.coverArtUrl,
      // Add other required properties with default values
      ai_used_for_lyrics: false,
      music_ai_generated: false,
    };
  };

  if (!currentSong) return null;

  return (
    <>
      {isMobile && isMinimized ? (
        // Minimized player view for mobile
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="container mx-auto px-2 py-1 flex items-center justify-between">
            <button onClick={() => setIsMinimized(false)} className="p-1">
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1">
              <button onClick={previous} className="p-1">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={isPlaying ? pause : resume} className="p-1">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button onClick={next} className="p-1">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
            <div className={`flex-grow ${isSmallMobile ? 'max-w-[80px]' : 'max-w-[120px]'} ml-2`}>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleTimeChange}
                className="w-full h-1"
              />
            </div>
          </div>
        </div>
      ) : (
        // Full player view
        <div
          className={`fixed bottom-0 ${leftOffset} right-0 bg-background border-t border-border z-50 transition-all duration-300`}
        >
          <div
            className={`container mx-auto px-4 py-2 ${
              isMobile ? 'flex flex-col space-y-2' : 'flex items-center justify-between'
            }`}
          >
            {/* Minimize Button for Mobile */}
            {isMobile && (
              <button onClick={() => setIsMinimized(true)} className="absolute top-2 right-2 p-1">
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
            {/* Song Info and Controls */}
            <div
              className={`flex ${
                isMobile
                  ? 'flex-col items-center space-y-2'
                  : 'items-center justify-between w-full'
              }`}
            >
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
                  <Link 
                    href={`/Songs/${currentSong.id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {currentSong.title}
                  </Link>
                  <Link
                    href={`/profile?id=${currentSong.uploaded_by}`}
                    className="text-xs text-muted-foreground hover:underline block"
                  >
                    {currentSong.artist}
                  </Link>
                </div>
              </div>
              {/* Playback Controls */}
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleShuffle}
                      className={`p-2 relative ${isShuffling ? 'text-purple-500 glow' : ''}`}
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shuffle plays all songs from the current playlist or active filters.</p>
                  </TooltipContent>
                </Tooltip>
                <button onClick={previous} className="p-2">
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={isPlaying ? pause : resume}
                  className="p-2"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>
                <button onClick={next} className="p-2">
                  <SkipForward className="w-6 h-6" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`p-2 relative ${repeatMode !== 'none' ? 'text-purple-500 glow' : ''}`}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsQueueVisible(!isQueueVisible)}
                  className="p-2"
                >
                  <ListMusic className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsLyricsBibleDialogOpen(true)}
                  className="p-2"
                >
                  <BookOpenText className="w-5 h-5" />
                </button>
                <div className="relative">
                  <SongOptionsMenu song={getSongForOptions(currentSong)} />
                </div>
              </div>
            </div>

            {/* Progress Slider */}
            <div className="flex items-center w-full">
              <span className="text-xs mr-2 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleTimeChange}
                className="w-full"
              />
              <span className="text-xs ml-2 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Queue Display */}
      {isQueueVisible && (
        <div
          className={`fixed bottom-[60px] ${leftOffset} right-0 max-h-[50vh] overflow-y-auto bg-background border border-border z-50 transition-all duration-300`}
        >
          {/* Queue Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold">Up Next</h3>
            <button onClick={() => setIsQueueVisible(false)} className="p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Queue List */}
          <div className="p-4">
            {queue.map((song, index) => (
              <div
                key={song.id}
                className={`flex items-center py-2 ${
                  currentSong?.id === song.id ? 'text-primary font-semibold' : ''
                }`}
              >
                <div className="mr-3">{index + 1}.</div>
                <div className="flex-1">
                  <div>{song.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {song.artist}
                  </div>
                </div>
                <button onClick={() => playSong(song)} className="p-1">
                  <Play className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add the LyricsBibleComparisonDialog */}
      {currentSong && (
        <LyricsBibleComparisonDialog
          isOpen={isLyricsBibleDialogOpen}
          onClose={() => setIsLyricsBibleDialogOpen(false)}
          song={currentSong}
        />
      )}
    </>
  );
}
