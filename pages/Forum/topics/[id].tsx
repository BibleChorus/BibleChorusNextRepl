import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import type { Topic, Song, Comment } from '@/types';
import { CommentList } from '@/components/ForumPage/CommentList';
import { NewCommentForm } from '@/components/ForumPage/NewCommentForm';
import Head from 'next/head';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ReactHtmlParser from 'html-react-parser';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

export default function TopicPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  type TopicWithSong = Topic & { song?: Song; comments?: Comment[]; is_locked?: boolean };
  const [topic, setTopic] = useState<TopicWithSong | null>(null);
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchTopic = async () => {
        try {
          const response = await axios.get(`/api/forum/topics/${id}`);
          const data = response.data as TopicWithSong;
          setTopic(data);
          setIsLocked(!!data.is_locked);
        } catch (error) {
          console.error('Error fetching topic:', error);
        }
      };
      fetchTopic();
    }
  }, [id]);

  if (!topic) {
    return <p>Loading...</p>;
  }

  const handlePlayClick = () => {
    if (topic.song) {
      if (currentSong?.id === topic.song.id) {
        if (isPlaying) {
          pause();
        } else {
          resume();
        }
      } else {
        playSong({
          id: topic.song.id,
          title: topic.song.title,
          artist: topic.song.artist || topic.song.username,
          audioUrl: topic.song.audio_url,
          audio_url: topic.song.audio_url,
          coverArtUrl: topic.song.song_art_url,
          duration: topic.song.duration,
          uploaded_by: topic.song.uploaded_by,
        });
      }
    }
  };

  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

  const handleCommentAdded = (newComment: Comment) => {
    setTopic((prevTopic) => ({
      ...prevTopic!,
      comments: [newComment, ...(prevTopic?.comments || [])],
    }));
  };

  const handleLockTopic = async () => {
    try {
      await axios.patch(`/api/forum/topics/${id}/lock`);
      setIsLocked(true);
    } catch (error) {
      console.error('Error locking topic:', error);
    }
  };

  const richTextStyles = {
    prose: cn(
      "prose dark:prose-invert max-w-none",
      // Links
      "prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-500",
      // Lists
      "prose-ol:list-decimal prose-ul:list-disc",
      // Headings
      "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4",
      "prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3",
      "prose-h3:text-lg prose-h3:font-bold prose-h3:mb-2",
      // Add spacing for lists
      "prose-ol:my-4 prose-ul:my-4",
      // Ensure proper list indentation
      "prose-ol:pl-4 prose-ul:pl-4"
    )
  };

  return (
    <>
      <Head>
        <title>{topic.title} - BibleChorus Forum</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Page Background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4">
            <div className="mb-6">
              <Link href="/forum">
                <Button variant="outline" size="sm" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Forum
                </Button>
              </Link>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-center mb-4"
            >
              <span className="block text-slate-900 dark:text-white mb-2 line-clamp-3">
                {topic.title}
              </span>
            </motion.h1>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span>Posted by <span className="font-medium text-slate-900 dark:text-white">{topic.username}</span></span>
              <span className="hidden sm:inline">•</span>
              <time dateTime={topic.created_at}>{new Date(topic.created_at).toLocaleDateString()}</time>
              {topic.category && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 dark:border-indigo-400/20 px-3 py-1.5 rounded-lg font-medium">
                    {topic.category}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-12 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-10"
          >
            {/* Topic Content */}
            <div className={richTextStyles.prose}>
              {ReactHtmlParser(topic.content)}
            </div>

            {/* Associated Song */}
            {topic.song && (
              <div className="mt-8 mb-10 p-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-md rounded-xl flex items-center gap-4 border border-slate-200/50 dark:border-slate-600/50">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={topic.song.song_art_url ? `${CDN_URL}${topic.song.song_art_url}` : '/biblechorus-icon.png'}
                    alt={topic.song.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg font-semibold truncate">{topic.song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{topic.song.artist || topic.song.username}</p>
                </div>
                <Button
                  onClick={handlePlayClick}
                  variant="outline"
                  size="icon"
                  className="ml-4 shrink-0"
                >
                  {currentSong?.id === topic.song.id && isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
              </div>
            )}

            {/* Comments Section */}
            <h2 className="text-2xl font-semibold mb-4">Comments</h2>

            {user && (
              <NewCommentForm
                topicId={topic.id}
                onCommentAdded={handleCommentAdded}
              />
            )}

            <CommentList 
              comments={topic.comments || []} 
              topicId={topic.id}
              onCommentAdded={handleCommentAdded}
            />

            {user?.is_moderator && !isLocked && (
              <Button variant="ghost" size="sm" onClick={handleLockTopic} className="mt-6">
                <Lock className="h-4 w-4" /> Lock Topic
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
