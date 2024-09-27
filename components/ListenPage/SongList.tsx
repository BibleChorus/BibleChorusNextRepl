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
    <div className="space-y-2 sm:space-y-4">
      {songs.map((song, index) => (
        <motion.div
          key={song.id}
          className="flex items-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg shadow relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          {/* Song Art with Play Button Overlay */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 relative group flex-shrink-0">
            {song.song_art_url && !imageError[song.id] ? (
              <img
                src={`${CDN_URL}${song.song_art_url}`}
                alt={song.title}
                className="w-full h-full object-cover rounded"
                onError={() => setImageError(prev => ({ ...prev, [song.id]: true }))}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
            <motion.div 
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <motion.button
                className="text-white p-1 sm:p-2"
                onClick={() => console.log('Play song:', song.audio_url)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8" />
              </motion.button>
            </motion.div>
          </div>

          {/* Song Details */}
          <div className="flex-1 min-w-0 pr-2"> {/* Added pr-2 for right padding */}
            <Link href={`/Songs/${song.id}`}>
              <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 hover:underline truncate">
                {song.title}
              </h2>
            </Link>
            <div className="flex items-center text-xs sm:text-sm mt-1">
              <button
                onClick={() => router.push(`/profile?id=${song.uploaded_by}`)}
                className="text-gray-600 dark:text-gray-400 hover:underline truncate"
              >
                {song.username || 'Unknown User'}
              </button>
              {song.bible_verses && song.bible_verses.length > 0 && (
                <>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="font-light text-xs sm:text-sm text-primary-600 dark:text-primary-400 italic overflow-hidden overflow-ellipsis whitespace-nowrap flex-shrink min-w-0 pr-1">
                    {formatBibleVerses(song.bible_verses)}
                  </span>
                </>
              )}
            </div>

            {/* Tags / Badges */}
            <div className="mt-1 sm:mt-2 flex flex-wrap gap-1">
              {song.genre && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 py-0">
                  {song.genre}
                </Badge>
              )}
              {song.bible_translation_used && (
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0">
                  {song.bible_translation_used}
                </Badge>
              )}
              {song.lyrics_scripture_adherence && (
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0">
                  {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
                </Badge>
              )}
              {song.is_continuous_passage !== undefined && (
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0">
                  {song.is_continuous_passage ? 'Continuous' : 'Non-Continuous'}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}