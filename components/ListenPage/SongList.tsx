"use client"

import React from 'react'
import Link from 'next/link'
import { Song } from '@/pages/listen'
import { Badge } from '@/components/ui/badge'
import { PlayCircle } from 'lucide-react'
import { useState } from 'react'

// Add this line to get the CDN URL
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

// Update the Song type to match the fields returned by the new API
export type Song = {
  id: number;
  title: string;
  artist: string;
  genre: string;
  created_at: string;
  audio_url: string;
  song_art_url?: string;
  bible_translation_used?: string;
  lyrics_scripture_adherence?: string;
  is_continuous_passage?: boolean;
};

interface SongListProps {
  songs: Song[]
}

export function SongList({ songs }: SongListProps) {
  const [imageError, setImageError] = useState<Record<number, boolean>>({})

  return (
    <div className="space-y-4">
      {songs.map((song) => (
        <div
          key={song.id}
          className="flex flex-col sm:flex-row items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          {/* Song Art */}
          <div className="w-full sm:w-32 sm:h-32 h-64 mb-4 sm:mb-0 sm:mr-4 relative">
            {song.song_art_url && !imageError[song.id] ? (
              <img
                // Modify this line to use the CDN URL
                src={`${CDN_URL}${song.song_art_url}`}
                alt={song.title}
                className="w-full h-full object-cover rounded"
                onError={() => setImageError(prev => ({ ...prev, [song.id]: true }))}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          {/* Song Details */}
          <div className="flex-1">
            <Link href={`/Songs/${song.id}`}>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {song.title}
              </h2>
            </Link>
            <p className="text-gray-600 dark:text-gray-300">
              {song.artist || 'Unknown Artist'}
            </p>

            {/* Tags / Badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              {song.genre && (
                <Badge variant="secondary">{song.genre}</Badge>
              )}
              {song.bible_translation_used && (
                <Badge variant="outline">{song.bible_translation_used}</Badge>
              )}
              {song.lyrics_scripture_adherence && (
                <Badge variant="outline">
                  {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
                </Badge>
              )}
              {song.is_continuous_passage !== undefined && (
                <Badge variant="outline">
                  {song.is_continuous_passage ? 'Continuous Passage' : 'Non-Continuous Passage'}
                </Badge>
              )}
            </div>
          </div>

          {/* Play Button */}
          <button
            className="mt-4 sm:mt-0 sm:ml-4 p-2 text-primary hover:text-primary-foreground"
            onClick={() => console.log('Play song:', song.audio_url)}
          >
            <PlayCircle className="h-8 w-8" />
          </button>
        </div>
      ))}
    </div>
  )
}