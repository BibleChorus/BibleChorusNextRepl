import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, Edit, Share2, Info, Trash2, Heart, Music, BookOpen, Star, ThumbsUp, ThumbsDown, X } from 'lucide-react'
import db from '@/db'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import axios from 'axios'
import { toast } from "sonner"
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { formatBibleVerses } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { MusicFilled, BookOpenFilled, StarFilled } from '@/components/ui/custom-icons'

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

interface Song {
  id: number
  title: string
  artist: string
  audio_url: string
  uploaded_by: number
  ai_used_for_lyrics: boolean
  music_ai_generated: boolean
  bible_translation_used: string
  genres: string[]
  lyrics_scripture_adherence: 'word_for_word' | 'close_paraphrase' | 'creative_inspiration'
  is_continuous_passage: boolean
  lyrics: string
  lyric_ai_prompt?: string
  music_ai_prompt?: string
  music_model_used?: string
  song_art_url: string
  created_at: string
  username: string
  bible_verses?: { book: string; chapter: number; verse: number }[]
}

interface SongPageProps {
  song: Song
}

export default function SongPage({ song }: SongPageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false)
  const [selectedVoteType, setSelectedVoteType] = useState<string>('')
  const [voteStates, setVoteStates] = useState<Record<string, number>>({})
  const [likeState, setLikeState] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [isLyricPromptOpen, setIsLyricPromptOpen] = useState(false)
  const [isMusicPromptOpen, setIsMusicPromptOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserVote()
      fetchUserLike()
      fetchLikeCount()
      fetchVoteCounts()
    }
  }, [user, song.id])

  const fetchUserVote = async () => {
    try {
      const response = await axios.get(`/api/votes`, {
        params: { user_id: user?.id, song_id: song.id }
      })
      const userVotes = response.data
      const newVoteStates: Record<string, number> = {}

      userVotes.forEach((vote: any) => {
        newVoteStates[vote.vote_type] = vote.vote_value
      })
      setVoteStates(newVoteStates)
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }

  const fetchUserLike = useCallback(async () => {
    if (!user) return
    try {
      const response = await axios.get(`/api/users/${user.id}/likes`)
      const userLikes = response.data
      setLikeState(userLikes.some((like: any) => like.likeable_type === 'song' && like.likeable_id === song.id))
    } catch (error) {
      console.error('Error fetching user likes:', error)
    }
  }, [user, song.id])

  const fetchLikeCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/likes/count')
      setLikeCount(response.data[song.id] || 0)
    } catch (error) {
      console.error('Error fetching like count:', error)
    }
  }, [song.id])

  const fetchVoteCounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/votes/count')
      setVoteCounts(response.data[song.id] || {})
    } catch (error) {
      console.error('Error fetching vote counts:', error)
    }
  }, [song.id])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Implement audio playback logic here
  }

  const deleteSong = async () => {
    setIsDeleting(true)
    try {
      const response = await axios.delete(`/api/songs/${song.id}/delete`)

      if (response.status === 200) {
        toast.success("Song deleted successfully")
        router.push('/profile') // Redirect to profile page after successful deletion
      } else {
        throw new Error('Failed to delete song')
      }
    } catch (error) {
      console.error('Error deleting song:', error)
      toast.error("Failed to delete song. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleVoteClick = (voteType: string) => {
    setSelectedVoteType(voteType)
    setIsVoteDialogOpen(true)
  }

  const handleVote = async (value: string) => {
    if (!user) return

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
        [selectedVoteType]: voteValue
      }))

      // Update the vote count
      setVoteCounts(prevCounts => ({
        ...prevCounts,
        [selectedVoteType]: response.data.count
      }))

      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    }

    setIsVoteDialogOpen(false)
  }

  const handleLike = useCallback(async () => {
    if (!user) {
      toast.error('You need to be logged in to like a song')
      return
    }

    try {
      if (likeState) {
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

      setLikeState(!likeState)

      // Update like count
      setLikeCount(prev => prev + (likeState ? -1 : 1))

      toast.success(likeState ? 'Song unliked' : 'Song liked')
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like status')
    }
  }, [user, likeState, song.id])

  const getVoteValue = (value: number | undefined): string => {
    if (value === 1) return 'up';
    if (value === -1) return 'down';
    return '0';
  };

  const getVoteLabel = (value: number): string => {
    if (value === 1) return 'Upvoted';
    if (value === -1) return 'Downvoted';
    return 'No vote';
  };

  const getVoteIcon = (voteType: string) => {
    const voteValue = voteStates[voteType] || 0;
    const isUpvoted = voteValue === 1;

    const iconProps = {
      className: 'h-4 w-4 mr-1',
    };

    if (isUpvoted) {
      switch (voteType) {
        case 'Best Musically':
          return <MusicFilled {...iconProps} style={{ color: '#3b82f6' }} />; // Blue color
        case 'Best Lyrically':
          return <BookOpen {...iconProps} style={{ color: '#22c55e' }} />; // Green color, but using outlined icon
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
    <div className="min-h-screen bg-background">
      <Head>
        <title>{song.title} - BibleChorus</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Song Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">{song.title}</CardTitle>
                  <p className="text-xl text-gray-600 dark:text-gray-400">{song.artist}</p>
                </div>
                <Image
                  src={song.song_art_url ? `${CDN_URL}${song.song_art_url}` : '/biblechorus-icon.png'}
                  alt={`${song.title} cover art`}
                  width={100}
                  height={100}
                  className="rounded-lg shadow-lg"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {song.genres && song.genres.map((genre, index) => (
                  <Badge key={`${song.id}-${genre}-${index}`} variant="secondary">
                    {genre}
                  </Badge>
                ))}
                <Badge variant="outline">{song.bible_translation_used}</Badge>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline">
                  {song.is_continuous_passage ? 'Continuous' : 'Non-Continuous'}
                </Badge>
                {song.ai_used_for_lyrics && <Badge variant="secondary">AI Lyrics</Badge>}
                {song.music_ai_generated && <Badge variant="secondary">AI Music</Badge>}
              </div>
              <p><strong>Uploaded by:</strong> {song.username}</p>
              <p><strong>Created at:</strong> {new Date(song.created_at).toLocaleString()}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={togglePlay}>
                {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => router.push(`/edit-song/${song.id}`)}><Edit className="mr-2" />Edit</Button>
                <Button variant="outline"><Share2 className="mr-2" />Share</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete this song?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the song, its associated data, and remove the audio and artwork files from storage.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteSong}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>

          {/* Votes and Likes Card */}
          <Card>
            <CardHeader>
              <CardTitle>Votes & Likes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleLike}
                  className="flex items-center justify-between text-gray-500 hover:text-red-500 transition-colors duration-200"
                >
                  <span>Likes</span>
                  <div className="flex items-center">
                    <Heart
                      className={`h-6 w-6 mr-2 ${
                        likeState ? 'fill-current text-red-500' : ''
                      }`}
                    />
                    <span className="text-lg">{likeCount}</span>
                  </div>
                </button>
                <button
                  onClick={() => handleVoteClick('Best Musically')}
                  className="flex items-center justify-between text-gray-500 hover:text-blue-500 transition-colors duration-200"
                >
                  <span>Best Musically</span>
                  <div className="flex items-center">
                    {getVoteIcon('Best Musically')}
                    <span className="text-lg">{voteCounts['Best Musically'] || 0}</span>
                  </div>
                </button>
                <button
                  onClick={() => handleVoteClick('Best Lyrically')}
                  className="flex items-center justify-between text-gray-500 hover:text-green-500 transition-colors duration-200"
                >
                  <span>Best Lyrically</span>
                  <div className="flex items-center">
                    {getVoteIcon('Best Lyrically')}
                    <span className="text-lg">{voteCounts['Best Lyrically'] || 0}</span>
                  </div>
                </button>
                <button
                  onClick={() => handleVoteClick('Best Overall')}
                  className="flex items-center justify-between text-gray-500 hover:text-yellow-500 transition-colors duration-200"
                >
                  <span>Best Overall</span>
                  <div className="flex items-center">
                    {getVoteIcon('Best Overall')}
                    <span className="text-lg">{voteCounts['Best Overall'] || 0}</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Bible Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Bible Verses</CardTitle>
            </CardHeader>
            <CardContent>
              {song.bible_verses && song.bible_verses.length > 0 ? (
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  {formatBibleVerses(song.bible_verses)}
                </p>
              ) : (
                <p>No specific Bible verses associated with this song.</p>
              )}
            </CardContent>
          </Card>

          {/* Lyrics Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Lyrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{song.lyrics}</p>
            </CardContent>
          </Card>

          {/* AI Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>AI Information</CardTitle>
            </CardHeader>
            <CardContent>
              {song.ai_used_for_lyrics && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Lyric AI</h3>
                  <Button variant="outline" onClick={() => setIsLyricPromptOpen(true)}>View Lyric AI Prompt</Button>
                </div>
              )}
              {song.music_ai_generated && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Music AI</h3>
                  <p><strong>Model:</strong> {song.music_model_used}</p>
                  <Button variant="outline" onClick={() => setIsMusicPromptOpen(true)}>View Music AI Prompt</Button>
                </div>
              )}
              {!song.ai_used_for_lyrics && !song.music_ai_generated && (
                <p>No AI was used in the creation of this song.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Vote Dialog */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">Vote for {selectedVoteType}</DialogTitle>
            <DialogDescription className="text-center">{song.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {voteStates[selectedVoteType] !== 1 && (
              <Button onClick={() => handleVote('up')} variant="outline" className="w-full sm:w-auto">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Upvote
              </Button>
            )}
            {voteStates[selectedVoteType] !== -1 && (
              <Button onClick={() => handleVote('down')} variant="outline" className="w-full sm:w-auto">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Downvote
              </Button>
            )}
            {voteStates[selectedVoteType] !== 0 && (
              <Button onClick={() => handleVote('0')} variant="outline" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Remove Vote
              </Button>
            )}
          </div>
          <div className="text-sm text-center text-muted-foreground mt-4">
            Your current vote: {getVoteLabel(voteStates[selectedVoteType] || 0)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lyric AI Prompt Dialog */}
      <Dialog open={isLyricPromptOpen} onOpenChange={setIsLyricPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lyric AI Prompt</DialogTitle>
          </DialogHeader>
          <p>{song.lyric_ai_prompt}</p>
        </DialogContent>
      </Dialog>

      {/* Music AI Prompt Dialog */}
      <Dialog open={isMusicPromptOpen} onOpenChange={setIsMusicPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Music AI Prompt</DialogTitle>
          </DialogHeader>
          <p>{song.music_ai_prompt}</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }

  try {
    const song = await db('songs')
      .join('users', 'songs.uploaded_by', 'users.id')
      .where('songs.id', id)
      .select('songs.*', 'users.username')
      .first()

    if (!song) {
      return {
        notFound: true
      }
    }

    // Fetch Bible verses for the song
    const verses = await db('song_verses')
      .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
      .where('song_verses.song_id', id)
      .select('bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse')
      .orderBy(['bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse'])

    song.bible_verses = verses

    return {
      props: { song: JSON.parse(JSON.stringify(song)) }
    }
  } catch (error) {
    console.error('Error fetching song:', error)
    return {
      notFound: true
    }
  }
}