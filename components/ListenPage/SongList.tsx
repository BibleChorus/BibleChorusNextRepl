"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PlayCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { formatBibleVerses } from '@/lib/utils'; // We'll create this utility function

// Add this line to get the CDN URL
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

// Update the Song type to match the fields returned by the new API
export type Song = {
  id: number;
  title: string;
  username: string; // Add this line
  uploaded_by: number; // Add this line
  genre: string;
  created_at: string;
  audio_url: string;
  song_art_url?: string;
  bible_translation_used?: string;
  lyrics_scripture_adherence?: string;
  is_continuous_passage?: boolean;
  bible_verses?: { book: string; chapter: number; verse: number }[];
};

interface SongListProps {
  songs: Song[]
}

export function SongList({ songs }: SongListProps) {
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const router = useRouter()

  return (
    <div className="space-y-4">
      {songs.map((song, index) => (
        <motion.div
          key={song.id}
          className="flex flex-col sm:flex-row items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* Song Art with Play Button Overlay */}
          <div className="w-full sm:w-32 sm:h-32 h-64 mb-4 sm:mb-0 sm:mr-4 relative group">
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
            <motion.div 
              className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${index === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              initial={{ opacity: index === 0 ? 1 : 0 }}
              whileHover={{ opacity: 1 }}
            >
              <motion.button
                className="text-white p-2"
                onClick={() => console.log('Play song:', song.audio_url)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PlayCircle className="h-12 w-12" />
              </motion.button>
            </motion.div>
          </div>

          {/* Song Details */}
          <div className="flex-1">
            <Link href={`/Songs/${song.id}`}>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:underline">
                {song.title}
              </h2>
            </Link>
            <button
              onClick={() => router.push(`/profile?id=${song.uploaded_by}`)}
              className="text-primary hover:underline"
            >
              {song.username || 'Unknown User'}
            </button>

            {/* Bible Verses */}
            {song.bible_verses && song.bible_verses.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-primary-600 dark:text-primary-400 italic border-l-2 border-primary-500 pl-2">
                  {formatBibleVerses(song.bible_verses)}
                </p>
              </div>
            )}

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
        </motion.div>
      ))}
    </div>
  )
}