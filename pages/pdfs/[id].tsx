import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import db from '@/db';
import { parsePostgresArray } from '@/lib/utils';
import { Pdf, PdfComment, PdfNote } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CommentList } from '@/components/PdfComments/CommentList';
import { NewCommentForm } from '@/components/PdfComments/NewCommentForm';
import { NotesSection } from '@/components/PdfNotes/NotesSection';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from 'axios';

interface PdfPageProps {
  pdf: Pdf & { username: string };
  initialComments: PdfComment[];
  initialNotes: PdfNote[];
}

export default function PdfPage({ pdf, initialComments, initialNotes }: PdfPageProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PdfComment[]>(initialComments);
  const [ratingCounts, setRatingCounts] = useState({ quality: 0, theology: 0, helpfulness: 0 });

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


  return (
    <div className="container mx-auto py-6 space-y-6">
      <Head>
        <title>{pdf.title}</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold mb-1">{pdf.title}</h1>
        {pdf.author && <p className="text-muted-foreground">By {pdf.author}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          {pdf.themes.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <iframe
          src={`/pdf-viewer?file=${encodeURIComponent(pdf.file_url)}`}
          className="w-full h-[70vh] border rounded-md"
          allow="fullscreen"
        />
      </div>

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
        <CommentList comments={comments} pdfId={pdf.id} onCommentAdded={handleCommentAdded} />
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
        initialComments: JSON.parse(JSON.stringify(comments)),
        initialNotes: JSON.parse(JSON.stringify(notes)),
      },
    };
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return { notFound: true };
  }
};
