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
import { useTheme } from 'next-themes';

export default function TopicPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [topic, setTopic] = useState<any>(null);
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const [isLocked, setIsLocked] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    separator: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.2)',
    accentGlow: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(191, 161, 48, 0.1)',
  };

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
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="space-y-4 text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-4 mx-auto"
            style={{ 
              borderColor: theme.border,
              borderTopColor: theme.accent
            }}
          />
          <p style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}>
            Loading...
          </p>
        </div>
      </div>
    );
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
  
  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
  };

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
      "prose-a:underline",
      "prose-ol:list-decimal prose-ul:list-disc",
      "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4",
      "prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3",
      "prose-h3:text-lg prose-h3:font-bold prose-h3:mb-2",
      "prose-ol:my-4 prose-ul:my-4",
      "prose-ol:pl-4 prose-ul:pl-4"
    )
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      <Head>
        <title>{topic.title} - BibleChorus Forum</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden pb-20 pt-12"
      >
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0"
            style={{
              background: isDark 
                ? 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)'
                : 'radial-gradient(ellipse at 50% 0%, rgba(191, 161, 48, 0.06) 0%, transparent 50%)'
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 120%, rgba(212, 175, 55, 0.05), transparent 60%)'
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            style={{ color: theme.text, fontFamily: "'Italiana', serif" }}
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
              <Badge 
                className="px-4 py-1.5 text-sm font-medium rounded-full"
                style={{ 
                  backgroundColor: theme.accentGlow,
                  color: theme.accent,
                  border: `1px solid ${theme.borderHover}`,
                  fontFamily: "'Manrope', sans-serif"
                }}
              >
                {topic.category}
              </Badge>
            </motion.div>
          )}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-lg"
            style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
          >
            Posted by <span style={{ color: theme.text, fontWeight: 500 }}>{topic.username}</span> on {new Date(topic.created_at).toLocaleDateString()}
          </motion.p>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="backdrop-blur-2xl rounded-2xl shadow-2xl p-6 md:p-10"
          style={{ 
            backgroundColor: isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.border}`
          }}
        >
          <div className="mb-6">
            <Link href="/forum">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center rounded-lg transition-all duration-300"
                style={{ 
                  borderColor: theme.border,
                  color: theme.text,
                  fontFamily: "'Manrope', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.accent;
                  e.currentTarget.style.color = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.color = theme.text;
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forum
              </Button>
            </Link>
          </div>

          <div 
            className={richTextStyles.prose}
            style={{ 
              color: theme.text,
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            <style jsx global>{`
              .prose a {
                color: ${theme.accent};
              }
              .prose a:hover {
                color: ${theme.accentHover};
              }
              .prose h1, .prose h2, .prose h3, .prose h4 {
                font-family: 'Italiana', serif;
                color: ${theme.text};
              }
              .prose p, .prose li {
                color: ${theme.text};
              }
            `}</style>
            {ReactHtmlParser(topic.content)}
          </div>

          {topic.song && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 mb-6 p-4 rounded-xl shadow-sm flex items-center transition-all duration-300"
              style={{ 
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${theme.border}`
              }}
            >
              <div className="relative w-16 h-16 flex-shrink-0 mr-4 rounded-lg overflow-hidden">
                <Image
                  src={topic.song.song_art_url ? getImageUrl(topic.song.song_art_url) : '/biblechorus-icon.png'}
                  alt={topic.song.title}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="flex-grow">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: theme.text, fontFamily: "'Italiana', serif" }}
                >
                  {topic.song.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                >
                  {topic.song.artist || topic.song.username}
                </p>
              </div>
              <Button
                onClick={handlePlayClick}
                variant="outline"
                size="icon"
                className="ml-4 rounded-full transition-all duration-300"
                style={{ 
                  borderColor: theme.accent,
                  color: theme.accent
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.accent;
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.accent;
                }}
              >
                {currentSong?.id === topic.song.id && isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          )}

          <div 
            className="h-px my-8"
            style={{ 
              background: `linear-gradient(to right, transparent, ${theme.separator}, transparent)`
            }}
          />

          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ color: theme.text, fontFamily: "'Italiana', serif" }}
          >
            Comments
          </h2>

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 pt-6"
              style={{ borderTop: `1px solid ${theme.border}` }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLockTopic}
                className="flex items-center gap-2 transition-all duration-300"
                style={{ 
                  color: theme.textSecondary,
                  fontFamily: "'Manrope', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                <Lock className="h-4 w-4" /> Lock Topic
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
