"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, MoreVertical, Heart, Share2, ListPlus, Edit, Trash2, Flag, Vote, Music, BookOpen, Star } from 'lucide-react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { formatBibleVerses } from '@/lib/utils'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export type Song = {
  id: number;
  title: string;
  username: string;
  uploaded_by: number;
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

  const handleVote = (songId: number, voteType: string) => {
    console.log(`Voted for song ${songId} as ${voteType}`);
    // TODO: Implement actual voting logic here
  };

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
          <div className="flex-1 min-w-0 pr-2">
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

          {/* Dropdown Menu */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log('Like song:', song.id)}>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Like</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Share song:', song.id)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Add to playlist:', song.id)}>
                  <ListPlus className="mr-2 h-4 w-4" />
                  <span>Add to Playlist</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Vote className="mr-2 h-4 w-4" />
                    <span>Vote</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleVote(song.id, 'Best Musically')}>
                      <Music className="mr-2 h-4 w-4" />
                      <span>Best Musically</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleVote(song.id, 'Best Lyrically')}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Best Lyrically</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleVote(song.id, 'Best Overall')}>
                      <Star className="mr-2 h-4 w-4" />
                      <span>Best Overall</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => router.push(`/edit-song/${song.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Delete song:', song.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Report song:', song.id)}>
                  <Flag className="mr-2 h-4 w-4" />
                  <span>Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      ))}
    </div>
  )
}