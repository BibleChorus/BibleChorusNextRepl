import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Play, Pause } from 'lucide-react';
import Image from 'next/image';

export default function FloatingMusicPlayer() {
  // ... existing code ...
  {{
    const { currentSong, isPlaying, pause, resume } = useMusicPlayer();

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
          <div className="flex items-center space-x-4">
            <button onClick={isPlaying ? pause : resume} className="p-2">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            {/* Add more controls if needed */}
          </div>
        </div>
      </div>
    );
  }}
  // ... existing code ...
}