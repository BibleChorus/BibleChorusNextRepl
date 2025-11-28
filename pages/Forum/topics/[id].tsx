import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
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
  const [topic, setTopic] = useState<any>(null);
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchTopic = async () => {
        try {
          const response = await axios.get(`/api/forum/topics/${id}`);
          setTopic(response.data);
          setIsLocked(response.data.is_locked);
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

  const handleCommentAdded = (newComment: any) => {
    setTopic((prevTopic: any) => ({
      ...prevTopic,
      comments: [newComment, ...prevTopic.comments],
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <Head>
        <title>{topic.title} - BibleChorus Forum</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden pb-20 pt-12"
      >
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.06] to-pink-500/[0.08] dark:from-indigo-500/[0.15] dark:via-purple-500/[0.12] dark:to-pink-500/[0.15]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {topic.title}
          </motion.h1>
          {topic.category && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-4"
            >
              <Badge variant="secondary">{topic.category}</Badge>
            </motion.div>
          )}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-slate-600 dark:text-slate-300 text-lg"
          >
            Posted by {topic.username} on {new Date(topic.created_at).toLocaleDateString()}
          </motion.p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-6 md:p-10"
        >
          <div className="mb-6">
            <Link href="/forum">
              <Button variant="outline" size="sm" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forum
              </Button>
            </Link>
          </div>

          <div className={richTextStyles.prose}>
            {ReactHtmlParser(topic.content)}
          </div>

      {topic.song && (
        <div className="mb-6 p-4 bg-card rounded-lg shadow-sm flex items-center">
          <div className="relative w-16 h-16 flex-shrink-0 mr-4">
            <Image
              src={topic.song.song_art_url ? `${CDN_URL}${topic.song.song_art_url}` : '/biblechorus-icon.png'}
              alt={topic.song.title}
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold">{topic.song.title}</h3>
            <p className="text-sm text-muted-foreground">{topic.song.artist || topic.song.username}</p>
          </div>
          <Button
            onClick={handlePlayClick}
            variant="outline"
            size="icon"
            className="ml-4"
          >
            {currentSong?.id === topic.song.id && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

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
        <Button variant="ghost" size="sm" onClick={handleLockTopic}>
          <Lock className="h-4 w-4" /> Lock Topic
        </Button>
      )}
        </motion.div>
      </div>
    </div>
  );
}
