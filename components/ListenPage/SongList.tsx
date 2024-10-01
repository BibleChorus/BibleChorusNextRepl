"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, MoreVertical, Heart, Share2, ListPlus, Edit, Trash2, Flag, Vote, Music, BookOpen, Star, ThumbsUp, ThumbsDown, X } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import { toast } from "sonner"
import { MusicFilled, BookOpenFilled, StarFilled } from '@/components/ui/custom-icons'

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export type Song = {
  id: number;
  title: string;
  username: string;
  uploaded_by: number;
  genres?: string[];
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

interface VoteState {
  [songId: number]: {
    [voteType: string]: number;
  };
}

interface LikeState {
  [songId: number]: boolean;
}

interface VoteCounts {
  [songId: number]: {
    [voteType: string]: number;
  };
}

export const SongList = React.memo(function SongList({ songs }: SongListProps) {
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const router = useRouter()
  const { user } = useAuth()
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [selectedVoteType, setSelectedVoteType] = useState<string>('')
  const [voteStates, setVoteStates] = useState<VoteState>({})
  const [likeStates, setLikeStates] = useState<LikeState>({})
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({})
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({})

  useEffect(() => {
    if (user) {
      fetchUserVotes()
      fetchUserLikes()
      fetchLikeCounts()
      fetchVoteCounts()
    }
  }, [user])

  const fetchUserVotes = async () => {
    try {
      const response = await axios.get(`/api/users/${user?.id}/votes`)
      const userVotes = response.data
      const newVoteStates: VoteState = {}
      userVotes.forEach((vote: any) => {
        if (!newVoteStates[vote.song_id]) {
          newVoteStates[vote.song_id] = {}
        }
        newVoteStates[vote.song_id][vote.vote_type] = vote.vote_value
      })
      setVoteStates(newVoteStates)
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }

  const fetchUserLikes = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${user.id}/likes`)
      const userLikes = response.data
      const newLikeStates: LikeState = {}
      userLikes.forEach((like: any) => {
        if (like.likeable_type === 'song') {
          newLikeStates[like.likeable_id] = true
        }
      })
      setLikeStates(newLikeStates)
    } catch (error) {
      console.error('Error fetching user likes:', error)
    }
  }, [user])

  const fetchLikeCounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/likes/count')
      setLikeCounts(response.data)
    } catch (error) {
      console.error('Error fetching like counts:', error)
    }
  }, [])

  const fetchVoteCounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/votes/count')
      setVoteCounts(response.data)
    } catch (error) {
      console.error('Error fetching vote counts:', error)
    }
  }, [])

  const handleVoteClick = async (song: Song, voteType: string) => {
    setSelectedSong(song)
    setSelectedVoteType(voteType)
    
    // Fetch the user's existing vote for this song and vote type
    if (user) {
      try {
        const response = await axios.get(`/api/votes`, {
          params: {
            user_id: user.id,
            song_id: song.id,
            vote_type: voteType
          }
        })
        const existingVote = response.data
        
        // Update the voteStates with the fetched vote
        setVoteStates(prevStates => ({
          ...prevStates,
          [song.id]: {
            ...prevStates[song.id],
            [voteType]: existingVote ? existingVote.vote_value : 0
          }
        }))
      } catch (error) {
        console.error('Error fetching existing vote:', error)
      }
    }
    
    setIsVoteDialogOpen(true)
  }

  const handleVote = async (value: string) => {
    if (!user || !selectedSong) return

    const voteValue = value === 'up' ? 1 : value === 'down' ? -1 : 0
    
    try {
      const response = await axios.post('/api/votes', {
        user_id: user.id,
        song_id: selectedSong.id,
        vote_type: selectedVoteType,
        vote_value: voteValue
      })

      setVoteStates(prevStates => ({
        ...prevStates,
        [selectedSong.id]: {
          ...prevStates[selectedSong.id],
          [selectedVoteType]: voteValue
        }
      }))

      // Update the vote count
      setVoteCounts(prevCounts => ({
        ...prevCounts,
        [selectedSong.id]: {
          ...prevCounts[selectedSong.id],
          [selectedVoteType]: response.data.count
        }
      }))

      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    }

    setIsVoteDialogOpen(false)
  }

  const handleLike = useCallback(async (song: Song) => {
    if (!user) {
      toast.error('You need to be logged in to like a song')
      return
    }

    try {
      const isLiked = likeStates[song.id]
      if (isLiked) {
        await axios.delete(`/api/likes`, {
          data: { user_id: user.id, likeable_type: 'song', likeable_id: song.id }
        })
      } else {
        await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'song',
          likeable_id: song.id
        })
      }

      setLikeStates(prev => ({
        ...prev,
        [song.id]: !isLiked
      }))

      // Update like count
      setLikeCounts(prev => ({
        ...prev,
        [song.id]: (prev[song.id] || 0) + (isLiked ? -1 : 1)
      }))

      toast.success(isLiked ? 'Song unliked' : 'Song liked')
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like status')
    }
  }, [user, likeStates])

  const getVoteValue = (value: number | undefined): string => {
    if (value === 1) return 'up';
    if (value === -1) return 'down';
    return '0';
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {songs.map((song) => (
        <SongListItem key={song.id} song={song} />
      ))}
    </div>
  )
})

const SongListItem = React.memo(function SongListItem({ song }: { song: Song }) {
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const router = useRouter()
  const { user } = useAuth()
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false)
  const [selectedVoteType, setSelectedVoteType] = useState<string>('')
  const [voteStates, setVoteStates] = useState<VoteState>({})
  const [likeStates, setLikeStates] = useState<LikeState>({})
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({})
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({})

  useEffect(() => {
    if (user) {
      fetchUserVotes()
      fetchUserLikes()
      fetchLikeCounts()
      fetchVoteCounts()
    }
  }, [user])

  const fetchUserVotes = async () => {
    try {
      const response = await axios.get(`/api/users/${user?.id}/votes`)
      const userVotes = response.data
      const newVoteStates: VoteState = {}
      userVotes.forEach((vote: any) => {
        if (!newVoteStates[vote.song_id]) {
          newVoteStates[vote.song_id] = {}
        }
        newVoteStates[vote.song_id][vote.vote_type] = vote.vote_value
      })
      setVoteStates(newVoteStates)
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }

  const fetchUserLikes = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${user.id}/likes`)
      const userLikes = response.data
      const newLikeStates: LikeState = {}
      userLikes.forEach((like: any) => {
        if (like.likeable_type === 'song') {
          newLikeStates[like.likeable_id] = true
        }
      })
      setLikeStates(newLikeStates)
    } catch (error) {
      console.error('Error fetching user likes:', error)
    }
  }, [user])

  const fetchLikeCounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/likes/count')
      setLikeCounts(response.data)
    } catch (error) {
      console.error('Error fetching like counts:', error)
    }
  }, [])

  const fetchVoteCounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/votes/count')
      setVoteCounts(response.data)
    } catch (error) {
      console.error('Error fetching vote counts:', error)
    }
  }, [])

  const handleVoteClick = (voteType: string) => {
    setSelectedVoteType(voteType)
    setIsVoteDialogOpen(true)
  }

  const handleVote = async (value: string) => {
    if (!user) {
      toast.error('You need to be logged in to vote')
      return
    }

    const voteValue = value === 'up' ? 1 : value === 'down' ? -1 : 0
    
    try {
      const response = await axios.post('/api/votes', {
        user_id: user.id,
        song_id: song.id,
        vote_type: selectedVoteType,
        vote_value: voteValue
      })

      setVoteStates(prevStates => ({
        ...prevStates,
        [song.id]: {
          ...prevStates[song.id],
          [selectedVoteType]: voteValue
        }
      }))

      // Update the vote count
      setVoteCounts(prevCounts => ({
        ...prevCounts,
        [song.id]: {
          ...prevCounts[song.id],
          [selectedVoteType]: response.data.count
        }
      }))

      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    }

    setIsVoteDialogOpen(false)
  }

  const handleLike = useCallback(async (song: Song) => {
    if (!user) {
      toast.error('You need to be logged in to like a song')
      return
    }

    try {
      const isLiked = likeStates[song.id]
      if (isLiked) {
        await axios.delete(`/api/likes`, {
          data: { user_id: user.id, likeable_type: 'song', likeable_id: song.id }
        })
      } else {
        await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'song',
          likeable_id: song.id
        })
      }

      setLikeStates(prev => ({
        ...prev,
        [song.id]: !isLiked
      }))

      // Update like count
      setLikeCounts(prev => ({
        ...prev,
        [song.id]: (prev[song.id] || 0) + (isLiked ? -1 : 1)
      }))

      toast.success(isLiked ? 'Song unliked' : 'Song liked')
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like status')
    }
  }, [user, likeStates])

  const getVoteValue = (value: number | undefined): string => {
    if (value === 1) return 'up';
    if (value === -1) return 'down';
    return '0';
  };

  const getCurrentVote = (songId: number, voteType: string): number => {
    return voteStates[songId]?.[voteType] || 0;
  };

  const getVoteLabel = (value: number): string => {
    if (value === 1) return 'Upvoted';
    if (value === -1) return 'Downvoted';
    return 'No vote';
  };

  const getVoteIcon = (voteType: string) => {
    const voteValue = voteStates[song.id]?.[voteType] || 0;
    const isUpvoted = voteValue === 1;

    const iconProps = {
      className: 'h-4 w-4 mr-1',
    };

    if (isUpvoted) {
      switch (voteType) {
        case 'Best Musically':
          return <MusicFilled {...iconProps} style={{ color: '#3b82f6' }} />; // Blue color
        case 'Best Lyrically':
          return <BookOpen {...iconProps} style={{ color: '#22c55e' }} />; // Green color, outlined
        case 'Best Overall':
          return <StarFilled {...iconProps} style={{ color: '#eab308' }} />; // Yellow color
        default:
          return null;
      }
    } else {
      // For downvotes or no votes, use the regular outlined icons
      switch (voteType) {
        case 'Best Musically':
          return <Music {...iconProps} />;
        case 'Best Lyrically':
          return <BookOpen {...iconProps} />;
        case 'Best Overall':
          return <Star {...iconProps} />;
        default:
          return null;
      }
    }
  };

  return (
    <motion.div
      className="flex items-stretch p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg shadow relative overflow-hidden"
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
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/Songs/${song.id}`} className="mb-1 sm:mb-0">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 hover:underline truncate">
              {song.title}
            </h2>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <button
              onClick={() => handleLike(song)}
              className="flex items-center text-gray-500 hover:text-red-500 transition-colors duration-200"
            >
              <Heart
                className={`h-4 w-4 mr-1 ${
                  likeStates[song.id] ? 'fill-current text-red-500' : ''
                }`}
              />
              <span>{likeCounts[song.id] || 0}</span>
            </button>
            <button
              onClick={() => handleVoteClick('Best Musically')}
              className="flex items-center text-gray-500 hover:text-blue-500 transition-colors duration-200"
            >
              {getVoteIcon('Best Musically')}
              <span>{voteCounts[song.id]?.['Best Musically'] || 0}</span>
            </button>
            <button
              onClick={() => handleVoteClick('Best Lyrically')}
              className="flex items-center text-gray-500 hover:text-green-500 transition-colors duration-200"
            >
              {getVoteIcon('Best Lyrically')}
              <span>{voteCounts[song.id]?.['Best Lyrically'] || 0}</span>
            </button>
            <button
              onClick={() => handleVoteClick('Best Overall')}
              className="flex items-center text-gray-500 hover:text-yellow-500 transition-colors duration-200"
            >
              {getVoteIcon('Best Overall')}
              <span>{voteCounts[song.id]?.['Best Overall'] || 0}</span>
            </button>
          </div>
        </div>
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
          {song.genres && song.genres.map((genre, index) => (
            <Badge key={`${song.id}-${genre}-${index}`} variant="secondary" className="text-[10px] sm:text-xs px-1 py-0">
              {genre}
            </Badge>
          ))}
          {song.bible_translation_used && (
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0">
              {song.bible_translation_used}
            </Badge>
          )}
          {song.lyrics_scripture_adherence && (
            <Badge variant="default" className="text-[10px] sm:text-xs px-1 py-0 bg-primary text-primary-foreground">
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
      <div className="flex-shrink-0 ml-2 flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleLike(song)}>
              <Heart className={`mr-2 h-4 w-4 ${likeStates[song.id] ? 'fill-current text-red-500' : ''}`} />
              <span>{likeStates[song.id] ? 'Unlike' : 'Like'}</span>
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
                <DropdownMenuItem onClick={() => handleVoteClick('Best Musically')}>
                  <Music className="mr-2 h-4 w-4" />
                  <span>Best Musically</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleVoteClick('Best Lyrically')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Best Lyrically</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleVoteClick('Best Overall')}>
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

      {/* Vote Dialog */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">Vote for {selectedVoteType}</DialogTitle>
            <DialogDescription className="text-center">{song.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {getCurrentVote(song.id, selectedVoteType) !== 1 && (
              <Button onClick={() => handleVote('up')} variant="outline" className="w-full sm:w-auto">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Upvote
              </Button>
            )}
            {getCurrentVote(song.id, selectedVoteType) !== -1 && (
              <Button onClick={() => handleVote('down')} variant="outline" className="w-full sm:w-auto">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Downvote
              </Button>
            )}
            {getCurrentVote(song.id, selectedVoteType) !== 0 && (
              <Button onClick={() => handleVote('0')} variant="outline" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Remove Vote
              </Button>
            )}
          </div>
          <div className="text-sm text-center text-muted-foreground mt-4">
            Your current vote: {getVoteLabel(getCurrentVote(song.id, selectedVoteType))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
})