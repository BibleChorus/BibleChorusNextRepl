import { GetServerSideProps } from 'next';
import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import db from '@/db';
import { parsePostgresArray } from '@/lib/utils';
import { Pdf, PdfComment, PdfNote } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CommentList } from '@/components/PdfComments/CommentList';
import Image from 'next/image';
import { NewCommentForm } from '@/components/PdfComments/NewCommentForm';
import { NotesSection } from '@/components/PdfNotes/NotesSection';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, ThumbsDown, Headphones, FileText, Share2, Sparkles } from 'lucide-react';
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

export default function PdfPage({ pdf, bibleVerses, initialComments, initialNotes }: PdfPageProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PdfComment[]>(initialComments);
  const [ratingCounts, setRatingCounts] = useState({ quality: 0, theology: 0, helpfulness: 0 });
  const [notebookLmUrl, setNotebookLmUrl] = useState(pdf.notebook_lm_url || '');
  const [summary, setSummary] = useState(pdf.summary || '');
  const [editingDetails, setEditingDetails] = useState(false);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

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
      const response = await apiClient.post(`/api/pdfs/${pdf.id}/rate`, {
        user_id: user.id,
        category,
        value,
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-white to-yellow-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-yellow-950/30">
      <Head>
        <title>{pdf.title}</title>
      </Head>

      {/* Page Background */}
      <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-white to-yellow-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-yellow-950/30">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Background Blobs & Gradients */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] via-rose-500/[0.06] to-emerald-500/[0.08] dark:from-amber-500/[0.15] dark:via-rose-500/[0.12] dark:to-emerald-500/[0.15]"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-amber-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-rose-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.1),rgba(255,255,255,0))]"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 dark:from-amber-500/20 dark:via-rose-500/20 dark:to-emerald-500/20 backdrop-blur-md border border-amber-500/20 dark:border-amber-500/30 shadow-lg">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 dark:from-amber-400 dark:via-rose-400 dark:to-emerald-400 bg-clip-text text-transparent font-semibold">
                  Study Resource
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold tracking-tight"
            >
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                  {pdf.title}
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 rounded-full scale-x-0 animate-scale-x"></div>
              </span>
            </motion.h1>

            {pdf.author && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-4 text-lg text-slate-600 dark:text-slate-300"
              >
                By {pdf.author}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-12 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-6 md:p-10 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
              {pdf.image_url && (
                <div className="w-full md:w-1/3 mb-4 md:mb-0">
                  <Image
                    src={
                      pdf.image_url.startsWith('http')
                        ? pdf.image_url
                        : `${process.env.NEXT_PUBLIC_CDN_URL ?? ''}${pdf.image_url}`
                    }
                    alt={pdf.title}
                    width={400}
                    height={500}
                    className="w-full h-auto object-contain rounded"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{pdf.title}</h1>
                {pdf.author && (
                  <p className="text-muted-foreground">By {pdf.author}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Uploaded on {new Date(pdf.created_at).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pdf.themes.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-700 dark:text-amber-300 hover:from-amber-500/20 hover:to-rose-500/20 transition-all duration-300 text-xs border-amber-500/20 dark:border-amber-400/20 font-medium px-2 py-1 rounded-lg"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
                {pdf.summary && <p className="mt-2 whitespace-pre-wrap">{pdf.summary}</p>}
                {(pdf.notebook_lm_url || pdf.file_url) && (
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    {pdf.notebook_lm_url && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            asChild
                            className="relative h-12 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group rounded-xl font-semibold"
                          >
                            <Link
                              href={pdf.notebook_lm_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                              <Image
                                src="/icons/notebooklm.svg"
                                alt="NotebookLM"
                                width={24}
                                height={24}
                                className="relative w-5 h-5 mr-2"
                              />
                              <span className="relative">Open in NotebookLM</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Google NotebookLM lets you ask questions and explore your PDFs.
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {pdf.file_url && (
                      <Button
                        asChild
                        className="relative h-12 px-6 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 hover:from-amber-700 hover:via-rose-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group rounded-xl font-semibold"
                      >
                        <Link
                          href={pdf.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                          <FileText className="relative w-5 h-5 mr-2" />
                          <span className="relative">Open PDF</span>
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      className="h-12 px-6 flex items-center gap-2 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 hover:scale-[1.02] rounded-xl font-medium"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </Button>
                  </div>
                )}
                {user && user.id === pdf.uploaded_by && (
                  <div className="mt-2 space-y-1">
                    {!editingDetails ? (
                      <Button size="sm" onClick={() => setEditingDetails(true)}>
                        Edit Details
                      </Button>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          value={notebookLmUrl}
                          onChange={(e) => setNotebookLmUrl(e.target.value)}
                          placeholder="https://notebooklm.google.com/..."
                        />
                        <Textarea
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="One paragraph summary"
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={handleDetailsSave}>Save Details</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingDetails(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 bg-clip-text text-transparent">Bible Verses</h2>
              {isLoadingVerses ? (
                <p>Loading verses...</p>
              ) : verses.length === 0 ? (
                <p>No verses linked.</p>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {verses.map((v, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{`${v.book} ${v.chapter}:${v.verse}`}</p>
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
                          >
                            <Headphones className="w-4 h-4" />
                          </Link>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v.text) }} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 bg-clip-text text-transparent">Ratings</h2>
              <div className="space-y-2">
                {(['quality', 'theology', 'helpfulness'] as const).map((cat) => (
                  <div key={cat} className="flex items-center space-x-2">
                    <span className="capitalize w-32">{cat}</span>
                    <Button
                      aria-label={`Upvote ${cat}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(cat, 1)}
                      className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-gradient-to-r hover:from-amber-500 hover:to-emerald-500 hover:text-white hover:border-transparent transition-all duration-300 rounded-lg"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      aria-label={`Downvote ${cat}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(cat, -1)}
                      className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-gradient-to-r hover:from-rose-500 hover:to-amber-500 hover:text-white hover:border-transparent transition-all duration-300 rounded-lg"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <span>{ratingCounts[cat]}</span>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 bg-clip-text text-transparent">Comments</h2>
              {user ? (
                <NewCommentForm pdfId={pdf.id} onCommentAdded={handleCommentAdded} />
              ) : (
                <p>Please log in to add a comment.</p>
              )}
              <CommentList
                comments={comments}
                pdfId={pdf.id}
                fileUrl={pdf.file_url}
                onCommentAdded={handleCommentAdded}
              />
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 bg-clip-text text-transparent">My Notes</h2>
              <NotesSection initialNotes={initialNotes} pdfId={pdf.id} />
            </section>
          </motion.div>
        </div>
      </div>
    </div>
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

    verses.sort((a, b) => {
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
