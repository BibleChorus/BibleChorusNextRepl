"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, MoreVertical, Heart, Share2, ListPlus, Edit, Trash2, Flag, Vote, Music, BookOpen, Star, ThumbsUp, ThumbsDown, X, Play, Pause, MessageCircle } from 'lucide-react'
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
import { useMusicPlayer } from '@/contexts/MusicPlayerContext'
import { CommentList } from '@/components/SongComments/CommentList';
import { NewCommentForm } from '@/components/SongComments/NewCommentForm';
import { SongComment } from '@/types';
import { ReportDialog } from '@/components/ReportDialog';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import Image from 'next/image' // Import Next.js Image component
import LyricsBibleComparisonDialog from './LyricsBibleComparisonDialog';
import { BookOpenText } from 'lucide-react';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export type Song = {
  id: number;
  title: string;
  username: string;
  uploaded_by: number;
  artist?: string; // Make artist optional
  genres?: string[];
  created_at: string;
  audio_url: string;
  song_art_url?: string;
  bible_translation_used?: string;
  lyrics_scripture_adherence?: string;
  is_continuous_passage?: boolean;
  bible_verses?: { book: string; chapter: number; verse: number }[];
  play_count?: number;
  duration?: number;
  comments_count?: number;
  lyrics: string;
};

interface SongListProps {
  songs: Song[];
  isNarrowView: boolean;
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

const formatDuration = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const SongList = React.memo(function SongList({ songs, isNarrowView }: SongListProps) {
  const [voteStates, setVoteStates] = useState<VoteState>({})
  const [likeStates, setLikeStates] = useState<LikeState>({})
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({})
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({})
  const { user } = useAuth()

  const fetchUserVotes = useCallback(async () => {
    if (!user) return
    try {
      const response = await axios.get(`/api/users/${user.id}/votes`)
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
  }, [user])

  const fetchUserLikes = useCallback(async () => {
    if (!user) return
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

  useEffect(() => {
    fetchLikeCounts()
    fetchVoteCounts()
    
    if (user) {
      fetchUserVotes()
      fetchUserLikes()
    }
  }, [user, fetchLikeCounts, fetchVoteCounts, fetchUserVotes, fetchUserLikes])

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

  const handleVoteClick = useCallback(async (song: Song, voteType: string, voteValue: number) => {
    setVoteStates(prevStates => ({
      ...prevStates,
      [song.id]: {
        ...prevStates[song.id],
        [voteType]: voteValue
      }
    }))

    setVoteCounts(prevCounts => ({
      ...prevCounts,
      [song.id]: {
        ...prevCounts[song.id],
        [voteType]: (prevCounts[song.id]?.[voteType] || 0) + voteValue - (voteStates[song.id]?.[voteType] || 0)
      }
    }))
  }, [voteStates])

  return (
    <div className="space-y-2 sm:space-y-4">
      {songs.map((song) => (
        <SongListItem
          key={song.id}
          song={song}
          songs={songs}
          likeCounts={likeCounts}
          voteCounts={voteCounts}
          likeStates={likeStates}
          voteStates={voteStates}
          handleLike={handleLike}
          handleVoteClick={handleVoteClick}
          isNarrowView={isNarrowView}
          commentsCount={song.comments_count || 0}
        />
      ))}
    </div>
  )
})

const SongListItem = React.memo(function SongListItem({ 
  song, 
  songs, 
  likeCounts, 
  voteCounts, 
  likeStates, 
  voteStates, 
  handleLike, 
  handleVoteClick,
  isNarrowView,
  commentsCount
}: { 
  song: Song, 
  songs: Song[], 
  likeCounts: Record<number, number>, 
  voteCounts: VoteCounts, 
  likeStates: LikeState, 
  voteStates: VoteState, 
  handleLike: (song: Song) => Promise<void>, 
  handleVoteClick: (song: Song, voteType: string, voteValue: number) => Promise<void>,
  isNarrowView: boolean,
  commentsCount: number
}) {
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const router = useRouter()
  const { user } = useAuth()
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false)
  const [selectedVoteType, setSelectedVoteType] = useState<string>('')
  const [localVoteCounts, setLocalVoteCounts] = useState(voteCounts[song.id] || {})
  const [localVoteStates, setLocalVoteStates] = useState(voteStates[song.id] || {})
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer()
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [comments, setComments] = useState<SongComment[]>([]);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false);
  const [isLyricsBibleDialogOpen, setIsLyricsBibleDialogOpen] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/songs/${song.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [song.id]);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      try {
        const response = await axios.get(`/api/songs/${song.id}/comments/count`);
        setLocalCommentsCount(response.data.count);
      } catch (error) {
        console.error('Error fetching comments count:', error);
      }
    };

    fetchCommentsCount();
  }, [song.id]);

  useEffect(() => {
    if (isCommentsDialogOpen) {
      fetchComments();
    }
  }, [isCommentsDialogOpen, fetchComments]);

  const handleCommentAdded = (newComment: SongComment) => {
    setComments((prevComments) => {
      const updatedComments = [...prevComments];
      if (newComment.parent_comment_id) {
        const parentIndex = updatedComments.findIndex(c => c.id === newComment.parent_comment_id);
        if (parentIndex !== -1) {
          updatedComments.splice(parentIndex + 1, 0, newComment);
        } else {
          updatedComments.push(newComment);
        }
      } else {
        updatedComments.push(newComment);
      }
      return updatedComments;
    });
    setLocalCommentsCount((prevCount) => prevCount + 1);
  };

  // Add this console.log to debug the duration
  console.log(`Song ${song.id} duration:`, song.duration);

  useEffect(() => {
    setLocalVoteCounts(voteCounts[song.id] || {})
    setLocalVoteStates(voteStates[song.id] || {})
  }, [voteCounts, voteStates, song.id])

  const handleLocalVoteClick = (voteType: string) => {
    if (!user) {
      toast.error('You need to be logged in to vote')
      return
    }
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

      // Update local state
      setLocalVoteStates(prev => ({
        ...prev,
        [selectedVoteType]: voteValue
      }))

      setLocalVoteCounts(prev => ({
        ...prev,
        [selectedVoteType]: response.data.count
      }))

      // Update parent state
      handleVoteClick(song, selectedVoteType, voteValue)

      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    }

    setIsVoteDialogOpen(false)
  }

  const getCurrentVote = (voteType: string): number => {
    return localVoteStates[voteType] || 0;
  };

  const getVoteLabel = (value: number): string => {
    if (value === 1) return 'Upvoted';
    if (value === -1) return 'Downvoted';
    return 'No vote';
  };

  const getVoteIcon = (voteType: string) => {
    const voteValue = localVoteStates[voteType] || 0;
    const isUpvoted = voteValue === 1;

    const iconProps = {
      className: 'h-4 w-4 mr-1',
    };

    if (isUpvoted) {
      switch (voteType) {
        case 'Best Musically':
          return <MusicFilled {...iconProps} style={{ color: '#3b82f6' }} />;
        case 'Best Lyrically':
          return <BookOpen {...iconProps} style={{ color: '#22c55e' }} />;
        case 'Best Overall':
          return <StarFilled {...iconProps} style={{ color: '#eab308' }} />;
        default:
          return null;
      }
    } else {
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

  const handleShare = useCallback(async () => {
    const songUrl = `${window.location.origin}/Songs/${song.id}`;
    const shareData = {
      title: song.title,
      text: `Check out this song: ${song.title} by ${song.artist || song.username}`,
      url: songUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Song shared successfully');
      } catch (error) {
        console.error('Error sharing song:', error);
        toast.error('Failed to share song');
      }
    } else {
      // Fallback to copying the link
      try {
        await navigator.clipboard.writeText(songUrl);
        toast.success('Song link copied to clipboard');
      } catch (error) {
        console.error('Error copying song link:', error);
        toast.error('Failed to copy song link');
      }
    }
  }, [song]);

  const handlePlayClick = () => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong(
        {
          id: song.id,
          title: song.title,
          artist: song.artist || song.username,
          audioUrl: song.audio_url,
          coverArtUrl: song.song_art_url,
          duration: song.duration,
          lyrics: song.lyrics,
          bible_verses: song.bible_verses,
          bible_translation_used: song.bible_translation_used,
          uploaded_by: song.uploaded_by,
        },
        songs.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist || s.username,
          audioUrl: s.audio_url,
          coverArtUrl: s.song_art_url,
          duration: s.duration,
          lyrics: s.lyrics,
          bible_verses: s.bible_verses,
          bible_translation_used: s.bible_translation_used,
          uploaded_by: s.uploaded_by,
          // ... other properties if needed ...
        }))
      );
    }
  };

  return (
    <motion.div
      className={`flex items-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg shadow relative overflow-hidden group song-card ${isNarrowView ? 'h-[72px] sm:h-[88px]' : ''}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Song Art with Play/Pause Button */}
      <div className={`${isNarrowView ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-20 h-20 sm:w-24 sm:h-24'} mr-3 sm:mr-4 relative flex-shrink-0`}>
        {song.song_art_url && !imageError[song.id] ? (
          <Image
            src={`${CDN_URL}${song.song_art_url}`}
            alt={song.title}
            layout="fill"
            objectFit="cover"
            className="rounded"
            onError={() => setImageError(prev => ({ ...prev, [song.id]: true }))}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}
        <div 
          className={`absolute inset-0 flex items-center justify-center 
            ${currentSong?.id === song.id ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-50 opacity-0 group-hover:opacity-100'} 
            transition-opacity duration-300`}
        >
          <button
            className="text-white p-1 sm:p-2"
            onClick={handlePlayClick}
          >
            {currentSong?.id === song.id && isPlaying ? (
              <Pause className={`${isNarrowView ? 'h-6 w-6 sm:h-8 sm:w-8' : 'h-8 w-8 sm:h-10 sm:w-10'}`} />
            ) : (
              <Play className={`${isNarrowView ? 'h-6 w-6 sm:h-8 sm:w-8' : 'h-8 w-8 sm:h-10 sm:w-10'}`} />
            )}
          </button>
        </div>
        {/* Play Count */}
        <div className="absolute top-1 left-1 inline-flex items-center bg-black bg-opacity-50 rounded px-1 py-0.5">
          <Play className="h-3 w-3 mr-1 text-white" />
          <span className="text-white text-xs">{song.play_count || 0}</span>
        </div>
        {/* Duration */}
        <div className="absolute bottom-1 right-1 inline-flex items-center bg-black bg-opacity-50 rounded px-1 py-0.5">
          <span className="text-white text-xs">
            {typeof song.duration === 'number' ? formatDuration(song.duration) : '0:00'}
          </span>
        </div>
      </div>

      {/* Song Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <Link href={`/Songs/${song.id}`} className="mb-1 sm:mb-0">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 hover:underline truncate">
              {song.title}
            </h2>
          </Link>
          <button
            onClick={() => setIsLyricsBibleDialogOpen(true)}
            className="text-gray-500 hover:text-primary-500 transition-colors duration-200 ml-2"
          >
            <BookOpenText className="h-5 w-5" />
          </button>
        </div>
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
            onClick={() => handleLocalVoteClick('Best Musically')}
            className="flex items-center text-gray-500 hover:text-blue-500 transition-colors duration-200"
          >
            {getVoteIcon('Best Musically')}
            <span>{localVoteCounts['Best Musically'] || 0}</span>
          </button>
          <button
            onClick={() => handleLocalVoteClick('Best Lyrically')}
            className="flex items-center text-gray-500 hover:text-green-500 transition-colors duration-200"
          >
            {getVoteIcon('Best Lyrically')}
            <span>{localVoteCounts['Best Lyrically'] || 0}</span>
          </button>
          <button
            onClick={() => handleLocalVoteClick('Best Overall')}
            className="flex items-center text-gray-500 hover:text-yellow-500 transition-colors duration-200"
          >
            {getVoteIcon('Best Overall')}
            <span>{localVoteCounts['Best Overall'] || 0}</span>
          </button>
          <button
            onClick={() => setIsCommentsDialogOpen(true)}
            className="flex items-center text-gray-500 hover:text-purple-500 transition-colors duration-200 ml-2"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>{localCommentsCount}</span>
          </button>
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
        {!isNarrowView && (
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
        )}
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
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsAddToPlaylistDialogOpen(true)}>
              <ListPlus className="mr-2 h-4 w-4" />
              <span>Add to Playlist</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Vote className="mr-2 h-4 w-4" />
                <span>Vote</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleLocalVoteClick('Best Musically')}>
                  <Music className="mr-2 h-4 w-4" />
                  <span>Best Musically</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLocalVoteClick('Best Lyrically')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Best Lyrically</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLocalVoteClick('Best Overall')}>
                  <Star className="mr-2 h-4 w-4" />
                  <span>Best Overall</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => setIsCommentsDialogOpen(true)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>Comment</span>
            </DropdownMenuItem>
            {user && (
              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                <Flag className="mr-2 h-4 w-4" />
                <span>Report</span>
              </DropdownMenuItem>
            )}
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
            {getCurrentVote(selectedVoteType) !== 1 && (
              <Button onClick={() => handleVote('up')} variant="outline" className="w-full sm:w-auto">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Upvote
              </Button>
            )}
            {getCurrentVote(selectedVoteType) !== -1 && (
              <Button onClick={() => handleVote('down')} variant="outline" className="w-full sm:w-auto">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Downvote
              </Button>
            )}
            {getCurrentVote(selectedVoteType) !== 0 && (
              <Button onClick={() => handleVote('0')} variant="outline" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Remove Vote
              </Button>
            )}
          </div>
          <div className="text-sm text-center text-muted-foreground mt-4">
            Your current vote: {getVoteLabel(getCurrentVote(selectedVoteType))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Join the discussion about this song.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4">
            {user && (
              <NewCommentForm
                songId={song.id}
                onCommentAdded={handleCommentAdded}
              />
            )}
            <CommentList
              comments={comments}
              songId={song.id}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </DialogContent>
      </Dialog>

      {user && (
        <ReportDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          songId={song.id}
          userId={user.id.toString()}
          username={user.username}
          userEmail={user.email}
        />
      )}

      <AddToPlaylistDialog
        isOpen={isAddToPlaylistDialogOpen}
        onClose={() => setIsAddToPlaylistDialogOpen(false)}
        songId={song.id}
      />

      <LyricsBibleComparisonDialog
        isOpen={isLyricsBibleDialogOpen}
        onClose={() => setIsLyricsBibleDialogOpen(false)}
        song={song}
      />
    </motion.div>
  )
})

export default SongList