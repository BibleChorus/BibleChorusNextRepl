import { GetServerSideProps } from 'next';
import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import db from '@/db';
import { parsePostgresArray } from '@/lib/utils';
import { Pdf, PdfComment, PdfNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CommentList } from '@/components/PdfComments/CommentList';
import Image from 'next/image';
import { NewCommentForm } from '@/components/PdfComments/NewCommentForm';
import { NotesSection } from '@/components/PdfNotes/NotesSection';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, ThumbsDown, Headphones, FileText, Share2, Sparkles, BookOpen, MessageSquare, StickyNote, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import DOMPurify from 'isomorphic-dompurify';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BIBLE_BOOKS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { FetchVersesResponse } from '@/types/api';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface PdfPageProps {
  pdf: Pdf & { username: string };
  bibleVerses: { book: string; chapter: number; verse: number }[];
  initialComments: PdfComment[];
  initialNotes: PdfNote[];
}

const FilmGrainOverlay: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.015]"
      style={{
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

interface AmbientOrbsOverlayProps {
  isDark: boolean;
}

const AmbientOrbsOverlay: React.FC<AmbientOrbsOverlayProps> = ({ isDark }) => {
  const orbColors = {
    primary: isDark ? 'rgba(212, 175, 55, 0.06)' : 'rgba(191, 161, 48, 0.05)',
    secondary: isDark ? 'rgba(160, 160, 160, 0.04)' : 'rgba(100, 100, 100, 0.03)',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full"
        style={{
          background: orbColors.primary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: orbColors.secondary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
};

export default function PdfPage({ pdf, bibleVerses, initialComments, initialNotes }: PdfPageProps) {
  const { user, getAuthToken } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [comments, setComments] = useState<PdfComment[]>(initialComments);
  const [ratingCounts, setRatingCounts] = useState({ quality: 0, theology: 0, helpfulness: 0 });
  const [notebookLmUrl, setNotebookLmUrl] = useState(pdf.notebook_lm_url || '');
  const [summary, setSummary] = useState(pdf.summary || '');
  const [editingDetails, setEditingDetails] = useState(false);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  };

  const handleCommentAdded = (comment: PdfComment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleVote = async (
    category: 'quality' | 'theology' | 'helpfulness',
    value: number,
  ) => {
    if (!user) {
      toast.error('You need to be logged in to vote');
      return;
    }
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      const response = await apiClient.post(
        `/api/pdfs/${pdf.id}/rate`,
        {
          category,
          value,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setRatingCounts((prev) => ({
        ...prev,
        [category]: response.data.count,
      }));
      toast.success('Vote submitted');
    } catch (err) {
      console.error('Error submitting vote', err);
      toast.error('Failed to submit vote');
    }
  };

  const handleDetailsSave = async () => {
    try {
      await apiClient.put(`/api/pdfs/${pdf.id}/edit`, {
        notebook_lm_url: notebookLmUrl || null,
        summary: summary || null,
      });
      toast.success('Details updated');
      setEditingDetails(false);
    } catch (err) {
      console.error('Error updating link', err);
      toast.error('Failed to update details');
    }
  };

  const handleShare = useCallback(async () => {
    const pdfUrl = `${window.location.origin}/pdfs/${pdf.id}`;
    const shareTitle = pdf.author ? `${pdf.title} by ${pdf.author}` : pdf.title;
    const shareText = pdf.author
      ? `Check out "${pdf.title}" by ${pdf.author} on BibleChorus`
      : `Check out "${pdf.title}" on BibleChorus`;

    const shareData = {
      title: shareTitle,
      text: shareText,
      url: pdfUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('PDF shared successfully');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing PDF:', error);
          toast.error('Failed to share PDF');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${pdfUrl}`);
        toast.success('PDF link copied to clipboard');
      } catch (error) {
        console.error('Error copying PDF link:', error);
        toast.error('Failed to copy PDF link');
      }
    }
  }, [pdf.id, pdf.title, pdf.author]);

  useEffect(() => {
    const fetchVerses = async () => {
      if (!bibleVerses || bibleVerses.length === 0) return;
      setIsLoadingVerses(true);
      try {
        const versesToFetch = bibleVerses.map((v) => ({
          translation: 'NASB',
          book: BIBLE_BOOKS.indexOf(v.book) + 1,
          chapter: v.chapter,
          verses: [v.verse],
        }));
        const { data } = await apiClient.post<FetchVersesResponse>('/api/fetch-verses', versesToFetch);
        const fetched = data.flat().map((verse) => ({
          book: BIBLE_BOOKS[verse.book - 1],
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
        }));
        setVerses(fetched);
      } catch (error) {
        console.error('Error fetching verses:', error);
      } finally {
        setIsLoadingVerses(false);
      }
    };
    fetchVerses();
  }, [bibleVerses]);

  if (!mounted) {
    return (
      <>
        <Head>
          <title>{pdf.title} | BibleChorus</title>
        </Head>
        <div 
          className="min-h-screen opacity-0" 
          style={{ fontFamily: "'Manrope', sans-serif" }} 
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{pdf.title} | BibleChorus</title>
      </Head>

      <div 
        className="min-h-screen relative"
        style={{ 
          backgroundColor: theme.bg,
          color: theme.text,
          fontFamily: "'Manrope', sans-serif"
        }}
      >
        <style jsx global>{`
          html, body {
            background-color: ${theme.bg} !important;
          }
        `}</style>

        <AmbientOrbsOverlay isDark={isDark} />
        <FilmGrainOverlay />

        <div className="relative" style={{ zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden pb-8 pt-16"
          >
            <div className="container mx-auto px-6 md:px-12">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-12"
              >
                <Link href="/pdfs">
                  <Button 
                    variant="ghost"
                    className="h-10 px-4 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                    style={{
                      color: theme.textSecondary,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Library
                  </Button>
                </Link>
              </motion.div>

              <div className="text-center max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="mb-6"
                >
                  <span 
                    className="text-xs tracking-[0.5em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.accent }}
                  >
                    Study Resource
                  </span>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl md:text-5xl lg:text-6xl tracking-tight mb-4"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  {pdf.title}
                </motion.h1>

                {pdf.author && (
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-lg font-light mb-6"
                    style={{ color: theme.textSecondary }}
                  >
                    by {pdf.author}
                  </motion.p>
                )}

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-3 mb-8"
                >
                  {pdf.themes.map((t) => (
                    <span 
                      key={t}
                      className="px-4 py-1.5 text-[10px] tracking-[0.15em] uppercase transition-all duration-300"
                      style={{ 
                        border: `1px solid ${theme.border}`,
                        color: theme.accent,
                        backgroundColor: 'transparent'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto px-6 md:px-12 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div 
                className="p-8 md:p-12"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgCard
                }}
              >
                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                  {pdf.image_url && (
                    <div className="md:col-span-1">
                      <div 
                        className="relative aspect-[3/4] overflow-hidden"
                        style={{ border: `1px solid ${theme.borderLight}` }}
                      >
                        <Image
                          src={
                            pdf.image_url.startsWith('http')
                              ? pdf.image_url
                              : `${process.env.NEXT_PUBLIC_CDN_URL ?? ''}${pdf.image_url}`
                          }
                          alt={pdf.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className={pdf.image_url ? 'md:col-span-2' : 'md:col-span-3'}>
                    <div className="space-y-6">
                      <div>
                        <p 
                          className="text-sm mb-2"
                          style={{ color: theme.textMuted }}
                        >
                          Uploaded by {pdf.username} on {new Date(pdf.created_at).toLocaleDateString()}
                        </p>
                        
                        {pdf.summary && (
                          <p 
                            className="text-base leading-relaxed font-light whitespace-pre-wrap"
                            style={{ color: theme.textSecondary }}
                          >
                            {pdf.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {pdf.notebook_lm_url && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={pdf.notebook_lm_url} target="_blank" rel="noopener noreferrer">
                                <Button
                                  className="h-12 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                                  style={{
                                    backgroundColor: theme.accent,
                                    color: isDark ? '#050505' : '#ffffff',
                                  }}
                                >
                                  <Image
                                    src="/icons/notebooklm.svg"
                                    alt="NotebookLM"
                                    width={20}
                                    height={20}
                                    className="mr-3"
                                  />
                                  NotebookLM
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              Google NotebookLM lets you ask questions and explore your PDFs.
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {pdf.file_url && (
                          <Link href={pdf.file_url} target="_blank" rel="noopener noreferrer">
                            <Button
                              variant="outline"
                              className="h-12 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                              style={{
                                borderColor: theme.borderHover,
                                color: theme.text,
                                backgroundColor: 'transparent',
                              }}
                            >
                              <FileText className="w-4 h-4 mr-3" />
                              Open PDF
                            </Button>
                          </Link>
                        )}
                        
                        <Button
                          variant="outline"
                          onClick={handleShare}
                          className="h-12 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                          style={{
                            borderColor: theme.border,
                            color: theme.textSecondary,
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-3" />
                          Share
                        </Button>
                      </div>

                      {user && user.id === pdf.uploaded_by && (
                        <div className="pt-4" style={{ borderTop: `1px solid ${theme.borderLight}` }}>
                          {!editingDetails ? (
                            <Button 
                              variant="ghost"
                              onClick={() => setEditingDetails(true)}
                              className="h-10 px-4 rounded-none text-xs tracking-[0.15em] uppercase font-medium"
                              style={{ color: theme.textMuted }}
                            >
                              Edit Details
                            </Button>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <label 
                                  className="block text-xs tracking-[0.15em] uppercase mb-2"
                                  style={{ color: theme.textMuted }}
                                >
                                  NotebookLM URL
                                </label>
                                <Input
                                  value={notebookLmUrl}
                                  onChange={(e) => setNotebookLmUrl(e.target.value)}
                                  placeholder="https://notebooklm.google.com/..."
                                  className="h-12 rounded-none bg-transparent"
                                  style={{
                                    borderColor: theme.border,
                                    color: theme.text,
                                  }}
                                />
                              </div>
                              <div>
                                <label 
                                  className="block text-xs tracking-[0.15em] uppercase mb-2"
                                  style={{ color: theme.textMuted }}
                                >
                                  Summary
                                </label>
                                <Textarea
                                  value={summary}
                                  onChange={(e) => setSummary(e.target.value)}
                                  placeholder="One paragraph summary"
                                  className="min-h-[100px] rounded-none bg-transparent"
                                  style={{
                                    borderColor: theme.border,
                                    color: theme.text,
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <Button 
                                  onClick={handleDetailsSave}
                                  className="h-10 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium"
                                  style={{
                                    backgroundColor: theme.accent,
                                    color: isDark ? '#050505' : '#ffffff',
                                  }}
                                >
                                  Save
                                </Button>
                                <Button 
                                  variant="ghost"
                                  onClick={() => setEditingDetails(false)}
                                  className="h-10 px-4 rounded-none text-xs tracking-[0.15em] uppercase font-medium"
                                  style={{ color: theme.textMuted }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="mt-px p-8 md:p-12"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  borderTop: 'none',
                  backgroundColor: theme.bgCard
                }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <BookOpen className="w-5 h-5" style={{ color: theme.accent }} />
                  <h2 
                    className="text-xs tracking-[0.3em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                  >
                    Bible Verses
                  </h2>
                </div>

                {isLoadingVerses ? (
                  <div className="flex justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 rounded-full"
                      style={{ 
                        border: `1px solid ${theme.border}`,
                        borderTopColor: theme.accent
                      }}
                    />
                  </div>
                ) : verses.length === 0 ? (
                  <p className="text-sm font-light" style={{ color: theme.textMuted }}>
                    No verses linked to this document.
                  </p>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-6">
                      {verses.map((v, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          className="pb-6"
                          style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span 
                              className="text-sm font-medium"
                              style={{ fontFamily: "'Italiana', serif", color: theme.accent }}
                            >
                              {`${v.book} ${v.chapter}:${v.verse}`}
                            </span>
                            <Link
                              href={{
                                pathname: '/listen',
                                query: {
                                  bibleBooks: v.book,
                                  bibleChapters: `${v.book}:${v.chapter}`,
                                  bibleVerses: `${v.book} ${v.chapter}:${v.verse}`,
                                },
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 transition-colors duration-300"
                              style={{ border: `1px solid ${theme.border}` }}
                            >
                              <Headphones className="w-3 h-3" style={{ color: theme.textMuted }} />
                            </Link>
                          </div>
                          <div 
                            className="text-sm leading-relaxed font-light"
                            style={{ color: theme.textSecondary }}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v.text) }} 
                          />
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div 
                className="mt-px p-8 md:p-12"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  borderTop: 'none',
                  backgroundColor: theme.bgCard
                }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <Sparkles className="w-5 h-5" style={{ color: theme.accent }} />
                  <h2 
                    className="text-xs tracking-[0.3em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                  >
                    Ratings
                  </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {(['quality', 'theology', 'helpfulness'] as const).map((cat) => (
                    <div 
                      key={cat} 
                      className="flex items-center justify-between p-4"
                      style={{ border: `1px solid ${theme.borderLight}` }}
                    >
                      <span 
                        className="text-sm capitalize"
                        style={{ color: theme.text }}
                      >
                        {cat}
                      </span>
                      <div className="flex items-center gap-3">
                        <Button
                          aria-label={`Upvote ${cat}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(cat, 1)}
                          className="h-8 w-8 p-0 rounded-none transition-all duration-300"
                          style={{ border: `1px solid ${theme.border}` }}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                        </Button>
                        <span 
                          className="text-sm font-medium min-w-[24px] text-center"
                          style={{ color: theme.text }}
                        >
                          {ratingCounts[cat]}
                        </span>
                        <Button
                          aria-label={`Downvote ${cat}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(cat, -1)}
                          className="h-8 w-8 p-0 rounded-none transition-all duration-300"
                          style={{ border: `1px solid ${theme.border}` }}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div 
                className="mt-px p-8 md:p-12"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  borderTop: 'none',
                  backgroundColor: theme.bgCard
                }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <MessageSquare className="w-5 h-5" style={{ color: theme.accent }} />
                  <h2 
                    className="text-xs tracking-[0.3em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                  >
                    Comments
                  </h2>
                </div>

                {user ? (
                  <NewCommentForm 
                    pdfId={pdf.id} 
                    onCommentAdded={handleCommentAdded} 
                    theme={theme}
                    isDark={isDark}
                  />
                ) : (
                  <p 
                    className="text-sm font-light mb-6"
                    style={{ color: theme.textMuted }}
                  >
                    Please log in to add a comment.
                  </p>
                )}
                <CommentList
                  comments={comments}
                  pdfId={pdf.id}
                  fileUrl={pdf.file_url}
                  onCommentAdded={handleCommentAdded}
                  theme={theme}
                  isDark={isDark}
                />
              </div>

              <div 
                className="mt-px p-8 md:p-12"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  borderTop: 'none',
                  backgroundColor: theme.bgCard
                }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <StickyNote className="w-5 h-5" style={{ color: theme.accent }} />
                  <h2 
                    className="text-xs tracking-[0.3em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                  >
                    My Notes
                  </h2>
                </div>

                <NotesSection 
                  initialNotes={initialNotes} 
                  pdfId={pdf.id} 
                  theme={theme}
                  isDark={isDark}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  try {
    const pdf = await db('pdfs')
      .join('users', 'pdfs.uploaded_by', 'users.id')
      .where('pdfs.id', id)
      .select('pdfs.*', 'users.username')
      .first();

    if (!pdf) {
      return { notFound: true };
    }

    if (typeof pdf.themes === 'string' || Array.isArray(pdf.themes)) {
      pdf.themes = parsePostgresArray(pdf.themes);
    } else {
      pdf.themes = [];
    }

    const verses = await db('pdf_verses')
      .join('bible_verses', 'pdf_verses.verse_id', 'bible_verses.id')
      .where('pdf_verses.pdf_id', id)
      .select('bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse');

    verses.sort((a: { book: string; chapter: number; verse: number }, b: { book: string; chapter: number; verse: number }) => {
      const bookDiff =
        BIBLE_BOOKS.indexOf(a.book) - BIBLE_BOOKS.indexOf(b.book);
      if (bookDiff !== 0) return bookDiff;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

    const comments = await db('pdf_comments')
      .join('users', 'pdf_comments.user_id', 'users.id')
      .where('pdf_comments.pdf_id', id)
      .select('pdf_comments.*', 'users.username')
      .orderBy('pdf_comments.created_at', 'asc');

    const notes = await db('pdf_notes')
      .where('pdf_id', id)
      .select();

    return {
      props: {
        pdf: JSON.parse(JSON.stringify(pdf)),
        bibleVerses: JSON.parse(JSON.stringify(verses)),
        initialComments: JSON.parse(JSON.stringify(comments)),
        initialNotes: JSON.parse(JSON.stringify(notes)),
      },
    };
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return { notFound: true };
  }
};
