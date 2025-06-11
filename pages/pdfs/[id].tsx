import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
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
import { ThumbsUp, ThumbsDown, Headphones } from 'lucide-react';
import axios from 'axios';
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
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

  const handleCommentAdded = (comment: PdfComment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleVote = async (category: 'quality' | 'theology' | 'helpfulness', value: number) => {
    try {
      await axios.post(`/api/pdfs/${pdf.id}/rate`, { category, value });
      setRatingCounts((prev) => ({ ...prev, [category]: prev[category] + value }));
    } catch (err) {
      console.error('Error submitting vote', err);
    }
  };

  const handleDetailsSave = async () => {
    try {
      await axios.put(`/api/pdfs/${pdf.id}/edit`, {
        notebook_lm_url: notebookLmUrl || null,
        summary: summary || null,
      });
      toast.success('Details updated');
    } catch (err) {
      console.error('Error updating link', err);
      toast.error('Failed to update details');
    }
  };

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
        const response = await axios.post('/api/fetch-verses', versesToFetch);
        const fetched = response.data.flat().map((verse: any) => ({
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
    <div className="container mx-auto py-6 space-y-6">
      <Head>
        <title>{pdf.title}</title>
      </Head>
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
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        {pdf.summary && <p className="mt-2 whitespace-pre-wrap">{pdf.summary}</p>}
        {pdf.notebook_lm_url && (
          <div className="mt-4 flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={pdf.notebook_lm_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src="/icons/notebooklm.svg"
                    alt="NotebookLM"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Google NotebookLM lets you ask questions and explore your PDFs.
              </TooltipContent>
            </Tooltip>
            <Link
              href={pdf.notebook_lm_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary text-lg"
            >
              Open in NotebookLM
            </Link>
          </div>
        )}
        {user && user.id === pdf.uploaded_by && (
          <div className="mt-2 space-y-1">
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
            <Button size="sm" onClick={handleDetailsSave}>Save Details</Button>
          </div>
        )}
        </div>
      </div>

      <div className="flex justify-center">
        <Link
          href={pdf.file_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="text-lg px-8">Open PDF in New Tab</Button>
        </Link>
      </div>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-2">Bible Verses</h2>
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
        <h2 className="text-xl font-semibold mb-2">Ratings</h2>
        <div className="space-y-2">
          {(['quality', 'theology', 'helpfulness'] as const).map((cat) => (
            <div key={cat} className="flex items-center space-x-2">
              <span className="capitalize w-32">{cat}</span>
              <Button aria-label={`Upvote ${cat}`} size="sm" variant="outline" onClick={() => handleVote(cat, 1)}>
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button aria-label={`Downvote ${cat}`} size="sm" variant="outline" onClick={() => handleVote(cat, -1)}>
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <span>{ratingCounts[cat]}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-2">Comments</h2>
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
        <h2 className="text-xl font-semibold mb-2">My Notes</h2>
        <NotesSection initialNotes={initialNotes} pdfId={pdf.id} />
      </section>
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
