import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import db from '@/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BookCheck } from 'lucide-react';
import Image from 'next/image';
import { Pdf } from '@/types';

interface PdfWithUser extends Pdf {
  username: string;
}

interface PdfDashboardProps {
  pdfs: PdfWithUser[];
}

export default function PdfDashboard({ pdfs }: PdfDashboardProps) {
  const [search, setSearch] = useState('');

  const filtered = pdfs.filter((pdf) => {
    const term = search.toLowerCase();
    return (
      pdf.title.toLowerCase().includes(term) ||
      (pdf.author && pdf.author.toLowerCase().includes(term)) ||
      pdf.themes.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Head>
        <title>Bible Study (books of the Bible, sermons, and books)</title>
      </Head>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bible Study (books of the Bible, sermons, and books)</h1>
        <Link href="/pdfs/upload">
          <Button>Upload New PDF</Button>
        </Link>
      </div>
      <Input
        placeholder="Search PDFs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((pdf) => (
          <Card key={pdf.id}>
            {pdf.image_url && (
              <Image
                src={
                  pdf.image_url.startsWith('http')
                    ? pdf.image_url
                    : `${process.env.NEXT_PUBLIC_CDN_URL ?? ''}${pdf.image_url}`
                }
                alt={pdf.title}
                width={320}
                height={480}
                className="w-full h-60 object-cover rounded-t"
              />
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                {pdf.title}
                {pdf.is_bible_book && (
                  <BookCheck className="w-5 h-5 text-yellow-500" />
                )}
              </CardTitle>
              {pdf.author && <CardDescription>By {pdf.author}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Uploaded by {pdf.username} on {new Date(pdf.created_at).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-1">
                {pdf.themes.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/pdfs/${pdf.id}`} className="ml-auto">
                <Button size="sm">View</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
        {filtered.length === 0 && <p>No PDFs found.</p>}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const pdfs = await db('pdfs')
      .join('users', 'pdfs.uploaded_by', 'users.id')
      .select('pdfs.*', 'users.username')
      .orderBy('pdfs.created_at', 'desc');
    const parsed = pdfs.map((p) => ({
      ...p,
      themes: Array.isArray(p.themes) ? p.themes : typeof p.themes === 'string' ? p.themes.replace(/^{|}$/g, '').split(',').map((t) => t.trim()) : [],
    }));
    return { props: { pdfs: JSON.parse(JSON.stringify(parsed)) } };
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return { props: { pdfs: [] } };
  }
};
