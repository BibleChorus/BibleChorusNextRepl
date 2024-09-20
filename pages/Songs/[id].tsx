import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, Edit, Share2, Info, Trash2 } from 'lucide-react'
import db from '@/db'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Song {
  id: number
  title: string
  artist: string
  audio_url: string
  uploaded_by: number
  ai_used_for_lyrics: boolean
  music_ai_generated: boolean
  bible_translation_used: string
  genre: string
  lyrics_scripture_adherence: 'The lyrics follow the scripture word-for-word' | 'The lyrics closely follow the scripture passage' | 'The lyrics are creatively inspired by the scripture passage'
  is_continuous_passage: boolean
  lyrics: string
  lyric_ai_prompt?: string
  music_ai_prompt?: string
  music_model_used?: string
  song_art_url: string
  created_at: string
}

interface SongPageProps {
  song: Song
}

export default function SongPage({ song }: SongPageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Implement audio playback logic here
  }

  const deleteSong = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/songs/${song.id}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/songs') // Redirect to songs list page after successful deletion
      } else {
        throw new Error('Failed to delete song')
      }
    } catch (error) {
      console.error('Error deleting song:', error)
      alert('Failed to delete song. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const fallbackImageUrl = '/biblechorus-icon.png' // Adjust this path if needed

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>{song.title} - BibleChorus</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Back
        </Button>

        <Card className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 p-4">
              <Image
                src={song.song_art_url && song.song_art_url.startsWith('/') ? song.song_art_url : fallbackImageUrl}
                alt={`${song.title} cover art`}
                width={300}
                height={300}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <CardContent className="md:w-2/3 p-6">
              <CardHeader>
                <CardTitle className="text-3xl font-bold mb-2">{song.title}</CardTitle>
                <p className="text-xl text-gray-600 dark:text-gray-400">{song.artist}</p>
              </CardHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{song.genre}</Badge>
                  <Badge variant="outline">{song.bible_translation_used}</Badge>
                  {song.ai_used_for_lyrics && <Badge variant="secondary">AI Lyrics</Badge>}
                  {song.music_ai_generated && <Badge variant="secondary">AI Music</Badge>}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Scripture Adherence</h3>
                  <p>{song.lyrics_scripture_adherence}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Lyrics</h3>
                  <p className="whitespace-pre-wrap">{song.lyrics}</p>
                </div>

                {song.ai_used_for_lyrics && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Lyric AI Prompt</h3>
                    <p>{song.lyric_ai_prompt}</p>
                  </div>
                )}

                {song.music_ai_generated && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Music AI Details</h3>
                    <p><strong>Model:</strong> {song.music_model_used}</p>
                    <p><strong>Prompt:</strong> {song.music_ai_prompt}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button onClick={togglePlay}>
                    {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline"><Edit className="mr-2" />Edit</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit song details (requires permissions)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline"><Info className="mr-2" />More Info</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <p><strong>Uploaded by:</strong> User ID {song.uploaded_by}</p>
                      <p><strong>Created at:</strong> {new Date(song.created_at).toLocaleString()}</p>
                      <p><strong>Continuous Passage:</strong> {song.is_continuous_passage ? 'Yes' : 'No'}</p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </div>
        </Card>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }

  try {
    const song = await db('songs').where('id', id).first()

    if (!song) {
      return {
        notFound: true
      }
    }

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