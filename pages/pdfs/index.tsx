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

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

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
                <span className="bg-gradient-to-r from-amber-500 via-pink-500 to-emerald-500 dark:from-amber-400 dark:via-pink-400 dark:to-emerald-400 bg-clip-text text-transparent font-semibold">
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
                <span className="bg-gradient-to-r from-amber-500 via-pink-500 to-emerald-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                  Library
                </span>
                <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-pink-500 to-emerald-500 rounded-full scale-x-0 animate-scale-x"></div>
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
                <Button className="h-12 px-8 bg-gradient-to-r from-amber-500 via-pink-500 to-emerald-500 hover:from-amber-600 hover:via-pink-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold">
                  Upload New PDF
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((pdf, index) => (
                <motion.div
                  key={pdf.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/80 dark:hover:border-slate-600/80 transition-all duration-500 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30 hover:scale-[1.01]"
                  whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-rose-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 via-rose-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* PDF Image */}
                  {pdf.image_url && (
                    <div className="relative overflow-hidden rounded-t-2xl">
                      <Image
                        src={
                          pdf.image_url.startsWith('http')
                            ? pdf.image_url
                            : `${CDN_URL}${pdf.image_url}`
                        }
                        alt={pdf.title}
                        width={320}
                        height={480}
                        className="w-full h-60 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="relative p-6">
                    {/* Title and Bible Book Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300 leading-tight">
                        {pdf.title}
                        {pdf.is_bible_book && (
                          <BookCheck className="inline w-5 h-5 text-amber-500 ml-2" />
                        )}
                      </h3>
                    </div>

                    {/* Author */}
                    {pdf.author && (
                      <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-4">
                        By {pdf.author}
                      </p>
                    )}

                    {/* Meta Information */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                          <BookCheck className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Uploaded by {pdf.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <time className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(pdf.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: new Date(pdf.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </time>
                      </div>
                    </div>

                    {/* Themes */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {pdf.themes.map((theme) => (
                        <Badge 
                          key={theme}
                          variant="secondary"
                          className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-700 dark:text-amber-300 hover:from-amber-500/20 hover:to-rose-500/20 transition-all duration-300 text-xs border-amber-500/20 dark:border-amber-400/20 font-medium px-2 py-1 rounded-lg"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>

                    {/* View Button */}
                    <div className="flex justify-end">
                      <Link href={`/pdfs/${pdf.id}`}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-gradient-to-r hover:from-amber-500 hover:to-rose-500 hover:text-white hover:border-transparent transition-all duration-300 rounded-xl font-medium px-4 py-2"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="relative mb-6">
                    <BookCheck className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-500 to-rose-500 rounded-full opacity-20"></div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">No PDFs found</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-lg max-w-md mx-auto">
                    Try adjusting your search terms or browse our collection of Bible study materials.
                  </p>
                </div>
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
