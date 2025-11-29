import React, { useEffect, useState, useRef } from 'react';
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
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSidebar } from '@/contexts/SidebarContext';
import LyricsBibleComparisonDialog from '@/components/ListenPage/LyricsBibleComparisonDialog';
import Link from 'next/link';
import { SongOptionsMenu } from '@/components/SongOptionsMenu';
import { Song } from '@/types';
import { useTheme } from 'next-themes';

interface MusicPlayerSong extends Partial<Song> {
  id: number;
  title: string;
  artist?: string;
  coverArtUrl?: string;
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

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  };

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [isLyricsBibleDialogOpen, setIsLyricsBibleDialogOpen] = useState(false);
  const queueListRef = useRef<HTMLDivElement>(null);

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

  const getSongForOptions = (song: MusicPlayerSong): Song => {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist || '',
      audio_url: song.audio_url,
      uploaded_by: song.uploaded_by,
      username: '',
      genres: [],
      created_at: '',
      duration: 0,
      song_art_url: song.coverArtUrl,
      ai_used_for_lyrics: false,
      music_ai_generated: false,
    };
  };

  if (!currentSong) return null;

  const controlButtonStyle = {
    color: theme.textSecondary,
    transition: 'all 0.2s ease',
  };

  const activeControlStyle = {
    color: theme.accent,
  };

  return (
    <>
      {isMobile && isMinimized ? (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 transition-colors duration-300"
          style={{ 
            backgroundColor: theme.bg,
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <div className="container mx-auto px-2 py-1 flex items-center justify-between">
            <button 
              onClick={() => setIsMinimized(false)} 
              className="p-1 transition-colors duration-200"
              style={controlButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1">
              <button 
                onClick={previous} 
                className="p-1 transition-colors duration-200"
                style={controlButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                onClick={isPlaying ? pause : resume} 
                className="p-1 transition-colors duration-200"
                style={{ color: theme.accent }}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button 
                onClick={next} 
                className="p-1 transition-colors duration-200"
                style={controlButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
              >
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
                style={{
                  accentColor: theme.accent,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`fixed bottom-0 ${leftOffset} right-0 z-50 transition-all duration-300`}
          style={{ 
            backgroundColor: theme.bg,
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <div
            className={`container mx-auto px-4 py-2 ${
              isMobile ? 'flex flex-col space-y-2' : 'flex items-center justify-between'
            }`}
          >
            {isMobile && (
              <button 
                onClick={() => setIsMinimized(true)} 
                className="absolute top-2 right-2 p-1 transition-colors duration-200"
                style={controlButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
            <div
              className={`flex ${
                isMobile
                  ? 'flex-col items-center space-y-2'
                  : 'items-center justify-between w-full'
              }`}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 relative mr-3">
                  <Image
                    src={currentSong.coverArtUrl || '/default-cover.jpg'}
                    alt={currentSong.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                    }}
                  />
                </div>
                <div>
                  <Link 
                    href={`/Songs/${currentSong.id}`}
                    className="text-sm font-semibold hover:underline transition-colors duration-200"
                    style={{ color: theme.text }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.text}
                  >
                    {currentSong.title}
                  </Link>
                  <Link
                    href={`/profile?id=${currentSong.uploaded_by}`}
                    className="text-xs hover:underline block transition-colors duration-200"
                    style={{ color: theme.textSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                  >
                    {currentSong.artist}
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleShuffle}
                  className="p-2 relative transition-all duration-200"
                  style={isShuffling ? activeControlStyle : controlButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                  onMouseLeave={(e) => {
                    if (!isShuffling) e.currentTarget.style.color = theme.textSecondary;
                  }}
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button 
                  onClick={previous} 
                  className="p-2 transition-colors duration-200"
                  style={controlButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={isPlaying ? pause : resume}
                  className="p-2 transition-colors duration-200"
                  style={{ color: theme.accent }}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>
                <button 
                  onClick={next} 
                  className="p-2 transition-colors duration-200"
                  style={controlButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                >
                  <SkipForward className="w-6 h-6" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className="p-2 relative transition-all duration-200"
                  style={repeatMode !== 'none' ? activeControlStyle : controlButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                  onMouseLeave={(e) => {
                    if (repeatMode === 'none') e.currentTarget.style.color = theme.textSecondary;
                  }}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsQueueVisible(!isQueueVisible)}
                  className="p-2 transition-colors duration-200"
                  style={isQueueVisible ? activeControlStyle : controlButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                  onMouseLeave={(e) => {
                    if (!isQueueVisible) e.currentTarget.style.color = theme.textSecondary;
                  }}
                >
                  <ListMusic className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsLyricsBibleDialogOpen(true)}
                  className="p-2 transition-colors duration-200"
                  style={controlButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                >
                  <BookOpenText className="w-5 h-5" />
                </button>
                <div className="relative">
                  <SongOptionsMenu song={getSongForOptions(currentSong)} />
                </div>
              </div>
            </div>

            <div className="flex items-center w-full">
              <span 
                className="text-xs mr-2 w-10 text-right"
                style={{ color: theme.textSecondary }}
              >
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleTimeChange}
                className="w-full"
                style={{
                  accentColor: theme.accent,
                }}
              />
              <span 
                className="text-xs ml-2 w-10"
                style={{ color: theme.textSecondary }}
              >
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {isQueueVisible && (
        <div
          className={`fixed bottom-[60px] ${leftOffset} right-0 max-h-[50vh] z-50 transition-all duration-300 flex flex-col`}
          style={{ 
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div 
            className="sticky top-0 z-10 p-4 flex items-center justify-between"
            style={{ 
              backgroundColor: theme.bg,
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <h3 
              className="text-lg font-semibold"
              style={{ color: theme.text }}
            >
              Up Next ({queue.length} songs)
            </h3>
            <button 
              onClick={() => setIsQueueVisible(false)} 
              className="p-1 rounded transition-colors duration-200"
              style={controlButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.accent;
                e.currentTarget.style.backgroundColor = theme.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={queueListRef} className="flex-1 overflow-y-auto">
            <div className="p-4">
              {queue.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center py-2 rounded px-2 -mx-2 cursor-pointer transition-all duration-200"
                  style={{ 
                    backgroundColor: currentSong?.id === song.id ? theme.hoverBg : 'transparent',
                    color: currentSong?.id === song.id ? theme.accent : theme.text,
                  }}
                  onClick={() => playSong(song)}
                  onMouseEnter={(e) => {
                    if (currentSong?.id !== song.id) {
                      e.currentTarget.style.backgroundColor = theme.hoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentSong?.id !== song.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div 
                    className="mr-3 text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {index + 1}.
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{song.title}</div>
                    <div 
                      className="text-xs truncate"
                      style={{ color: theme.textSecondary }}
                    >
                      {song.artist}
                    </div>
                  </div>
                  <Play 
                    className="w-4 h-4 flex-shrink-0 ml-2" 
                    style={{ color: theme.accent }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
