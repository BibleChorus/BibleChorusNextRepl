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
import { SongComment, Song } from '@/types';
import { ReportDialog } from '@/components/ReportDialog';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import Image from 'next/image' // Import Next.js Image component
import LyricsBibleComparisonDialog from './LyricsBibleComparisonDialog';
import { BookOpenText } from 'lucide-react';
import { SongOptionsMenu } from '@/components/SongOptionsMenu';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '/biblechorus-icon.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
};

interface SongListProps {
  songs: Song[];
  isNarrowView: boolean;
  totalSongs: number;
  fetchAllSongs: () => Promise<Song[]>;
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

export const SongList = React.memo(function SongList({ songs, isNarrowView, totalSongs, fetchAllSongs }: SongListProps) {
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
    <div className="space-y-2">
      {songs.map((song) => (
        <SongListItem
          key={song.id}
          song={song}
          songs={songs}
          totalSongs={totalSongs}
          fetchAllSongs={fetchAllSongs}
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
  totalSongs,
  fetchAllSongs,
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
  totalSongs: number,
  fetchAllSongs: () => Promise<Song[]>,
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

  const getVoteIcon = (voteType: string, isNarrow: boolean = false) => {
    const voteValue = localVoteStates[voteType] || 0;
    const isUpvoted = voteValue === 1;

    const iconProps = {
      className: isNarrow ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1',
    };

    if (isUpvoted) {
      switch (voteType) {
        case 'Best Musically':
          return <MusicFilled {...iconProps} style={{ color: '#3b82f6' }} />;
        case 'Best Lyrically':
          return <BookOpenFilled {...iconProps} style={{ color: '#22c55e' }} />;
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

  const handlePlayClick = async () => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      let queueSongs = songs;
      if (fetchAllSongs && totalSongs > songs.length) {
        try {
          queueSongs = await fetchAllSongs();
        } catch (error) {
          console.error('Error fetching all songs:', error);
        }
      }

      playSong(
        {
          id: song.id,
          title: song.title,
          artist: song.artist || song.username,
          audioUrl: song.audio_url,
          audio_url: song.audio_url,
          coverArtUrl: song.song_art_url,
          duration: song.duration,
          lyrics: song.lyrics,
          bible_verses: song.bible_verses,
          bible_translation_used: song.bible_translation_used,
          uploaded_by: song.uploaded_by,
        },
        queueSongs.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist || s.username,
          audioUrl: s.audio_url,
          audio_url: s.audio_url,
          coverArtUrl: s.song_art_url,
          duration: s.duration,
          lyrics: s.lyrics,
          bible_verses: s.bible_verses,
          bible_translation_used: s.bible_translation_used,
          uploaded_by: s.uploaded_by,
        }))
      );
    }
  };

  return (
    <motion.div
      className={`flex items-center p-2 sm:p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-lg relative overflow-hidden group song-card hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 ${isNarrowView ? 'h-[70px] sm:h-[80px]' : 'min-h-[110px]'}`}
      whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
      transition={{ duration: 0.3 }}
    >
      {/* Song Art with Play/Pause Button */}
      <div className={`${isNarrowView ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-20 sm:h-20'} mr-3 sm:mr-4 relative flex-shrink-0`}>
        {song.song_art_url && !imageError[song.id] ? (
          <Image
            src={getImageUrl(song.song_art_url)}
            alt={song.title}
            layout="fill"
            objectFit="cover"
            className="rounded-xl"
            onError={() => setImageError(prev => ({ ...prev, [song.id]: true }))}
          />
        ) : (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 text-xs backdrop-blur-sm">
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
              <Pause className={`${isNarrowView ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-7 w-7 sm:h-8 sm:w-8'}`} />
            ) : (
              <Play className={`${isNarrowView ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-7 w-7 sm:h-8 sm:w-8'}`} />
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
        <div className={`flex items-start justify-between ${isNarrowView ? 'mb-1' : 'mb-2'}`}>
          <Link href={`/Songs/${song.id}`} className="flex-1 min-w-0">
            <h2 className={`font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 truncate ${isNarrowView ? 'text-sm' : 'text-base sm:text-lg'}`}>
              {song.title}
            </h2>
          </Link>
          {!isNarrowView && (
            <button
              onClick={() => setIsLyricsBibleDialogOpen(true)}
              className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ml-3 flex-shrink-0"
            >
              <BookOpenText className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Artist and Bible Verses Row */}
        <div className={`flex items-center text-xs ${isNarrowView ? 'mb-1' : 'mb-2'}`}>
          <button
            onClick={() => router.push(`/profile?id=${song.uploaded_by}`)}
            className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors duration-200 truncate font-medium"
          >
            {song.username || 'Unknown User'}
          </button>
          {song.bible_verses && song.bible_verses.length > 0 && (
            <>
              <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400 italic overflow-hidden overflow-ellipsis whitespace-nowrap flex-shrink min-w-0">
                {formatBibleVerses(song.bible_verses)}
              </span>
            </>
          )}
        </div>
        
        {/* Action Buttons Row - Compact for narrow view */}
        <div className={`flex items-center ${isNarrowView ? 'gap-2 text-xs' : 'gap-3 text-sm flex-wrap'} ${isNarrowView ? 'mt-0' : 'mt-2'}`}>
          <button
            onClick={() => handleLike(song)}
            className="flex items-center text-slate-500 hover:text-red-500 transition-all duration-200 hover:scale-105"
          >
            <Heart
              className={`${isNarrowView ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1.5'} ${
                likeStates[song.id] ? 'fill-current text-red-500' : ''
              }`}
            />
            <span className="font-medium">{likeCounts[song.id] || 0}</span>
          </button>
          
          <button
            onClick={() => handleLocalVoteClick('Best Musically')}
            className="flex items-center text-slate-500 hover:text-blue-500 transition-all duration-200 hover:scale-105"
          >
            {getVoteIcon('Best Musically', isNarrowView)}
            <span className="font-medium">{localVoteCounts['Best Musically'] || 0}</span>
          </button>
          
          <button
            onClick={() => handleLocalVoteClick('Best Lyrically')}
            className="flex items-center text-slate-500 hover:text-green-500 transition-all duration-200 hover:scale-105"
          >
            {getVoteIcon('Best Lyrically', isNarrowView)}
            <span className="font-medium">{localVoteCounts['Best Lyrically'] || 0}</span>
          </button>
          
          <button
            onClick={() => handleLocalVoteClick('Best Overall')}
            className="flex items-center text-slate-500 hover:text-yellow-500 transition-all duration-200 hover:scale-105"
          >
            {getVoteIcon('Best Overall', isNarrowView)}
            <span className="font-medium">{localVoteCounts['Best Overall'] || 0}</span>
          </button>
          
          <button
            onClick={() => setIsCommentsDialogOpen(true)}
            className="flex items-center text-slate-500 hover:text-purple-500 transition-all duration-200 hover:scale-105"
          >
            <MessageCircle className={`${isNarrowView ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1.5'}`} />
            <span className="font-medium">{localCommentsCount}</span>
          </button>
          
          {isNarrowView && (
            <button
              onClick={() => setIsLyricsBibleDialogOpen(true)}
              className="flex items-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ml-auto"
            >
              <BookOpenText className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Enhanced Tags / Badges - More compact layout */}
        {!isNarrowView && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {song.genres && song.genres.slice(0, 3).map((genre, index) => (
              <Badge key={`${song.id}-${genre}-${index}`} variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 border-0 rounded-md font-medium">
                {genre}
              </Badge>
            ))}
            {song.genres && song.genres.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 border-0 rounded-md font-medium">
                +{song.genres.length - 3}
              </Badge>
            )}
            {song.bible_translation_used && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-md font-medium">
                {song.bible_translation_used}
              </Badge>
            )}
            {song.lyrics_scripture_adherence && (
              <Badge variant="default" className="text-xs px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 rounded-md font-medium">
                {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
              </Badge>
            )}
            {song.is_continuous_passage !== undefined && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-md font-medium">
                {song.is_continuous_passage ? 'Continuous' : 'Non-Continuous'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Use the updated SongOptionsMenu */}
      <div className="flex-shrink-0 ml-2 flex items-center">
        <SongOptionsMenu song={song} />
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