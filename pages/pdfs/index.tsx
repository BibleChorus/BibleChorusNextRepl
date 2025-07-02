import React, { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import db from '@/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BookCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Pdf } from '@/types';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

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
    <>
      <Head>
        <title>Bible Study Library</title>
        <link rel="icon" href="/favicon.ico" />
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
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-emerald-500/10 dark:from-amber-500/20 dark:via-rose-500/20 dark:to-emerald-500/20"></div>
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
                  Dive Deeper
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
            >
              <span className="block text-slate-900 dark:text-white mb-2">Bible Study</span>
              <span className="block relative">
                <span className="bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                  Library
                </span>
                <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 rounded-full scale-x-0 animate-scale-x"></div>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-8 text-xl text-slate-600 dark:text-slate-300 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
            >
              Explore sermons, books, and official Bible texts — each with interactive AI study tools.
            </motion.p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-12 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-10"
          >
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-10">
              <Input
                placeholder="Search PDFs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-12 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-700 transition-all duration-300 rounded-xl text-base"
              />
              <Link href="/pdfs/upload" className="shrink-0">
                <Button className="h-12 px-8 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 hover:from-amber-700 hover:via-rose-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold">
                  Upload New PDF
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((pdf) => (
                <Card key={pdf.id} className="transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
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
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center text-lg text-muted-foreground py-16">No PDFs found.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
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
