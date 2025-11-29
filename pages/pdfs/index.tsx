import React, { useState, useEffect } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import db from '@/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookCheck, Sparkles, Search, Plus, FileText } from 'lucide-react';
import Image from 'next/image';
import { Pdf } from '@/types';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
};

interface PdfWithUser extends Pdf {
  username: string;
}

interface PdfDashboardProps {
  pdfs: PdfWithUser[];
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
    tertiary: isDark ? 'rgba(229, 229, 229, 0.02)' : 'rgba(50, 50, 50, 0.02)',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{
          background: orbColors.primary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: orbColors.secondary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full"
        style={{
          background: orbColors.tertiary,
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
    </div>
  );
};

export default function PdfDashboard({ pdfs }: PdfDashboardProps) {
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

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

  const filtered = pdfs.filter((pdf) => {
    const term = search.toLowerCase();
    return (
      pdf.title.toLowerCase().includes(term) ||
      (pdf.author && pdf.author.toLowerCase().includes(term)) ||
      pdf.themes.some((t) => t.toLowerCase().includes(term))
    );
  });

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Bible Study Library | BibleChorus</title>
          <link rel="icon" href="/favicon.ico" />
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
        <title>Bible Study Library | BibleChorus</title>
        <link rel="icon" href="/favicon.ico" />
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
            className="relative overflow-hidden pb-16 pt-24"
          >
            <div className="container mx-auto px-6 md:px-12">
              <div className="flex justify-end mb-12">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Link href="/pdfs/upload">
                    <Button 
                      size="lg"
                      className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300"
                      style={{
                        backgroundColor: theme.accent,
                        color: isDark ? '#050505' : '#ffffff',
                      }}
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      Upload PDF
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <div className="text-center max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="mb-8"
                >
                  <span 
                    className="text-xs tracking-[0.5em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.accent }}
                  >
                    Dive Deeper Into Scripture
                  </span>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mb-8"
                >
                  <span 
                    className="block text-6xl md:text-7xl lg:text-8xl tracking-tight mb-2"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    Bible Study
                  </span>
                  <span 
                    className="block text-6xl md:text-7xl lg:text-8xl italic font-light"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text, opacity: 0.9 }}
                  >
                    Library
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
                  style={{ color: theme.textSecondary }}
                >
                  Explore sermons, books, and official Bible texts — each with interactive AI study tools.
                </motion.p>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto px-6 md:px-12 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12"
            >
              <div 
                className="relative max-w-xl mx-auto"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <Search 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: theme.textMuted }}
                />
                <Input
                  placeholder="Search by title, author, or theme..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-14 pl-12 pr-4 bg-transparent border-0 text-base rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ 
                    color: theme.text,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                />
              </div>
            </motion.div>

            {filtered.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-24"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <div 
                  className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <FileText className="w-6 h-6" style={{ color: theme.textSecondary }} />
                </div>
                <p 
                  className="text-xl mb-3"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  No PDFs Found
                </p>
                <p 
                  className="text-sm font-light"
                  style={{ color: theme.textSecondary }}
                >
                  Try adjusting your search or upload a new study resource.
                </p>
              </motion.div>
            ) : (
              <div 
                className="grid gap-px md:grid-cols-2 lg:grid-cols-3"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.hoverBg
                }}
              >
                {filtered.map((pdf, index) => (
                  <motion.div
                    key={pdf.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 * Math.min(index, 6) }}
                    className="group relative"
                    style={{
                      backgroundColor: theme.bgCard,
                      borderBottom: `1px solid ${theme.borderLight}`,
                      borderRight: `1px solid ${theme.borderLight}`,
                    }}
                  >
                    <Link href={`/pdfs/${pdf.id}`} className="block">
                      <div 
                        className="transition-colors duration-500"
                        style={{ backgroundColor: theme.bgCard }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.bgCard;
                        }}
                      >
                        {pdf.image_url && (
                          <div className="relative overflow-hidden aspect-[3/4]">
                            <Image
                              src={getImageUrl(pdf.image_url)}
                              alt={pdf.title}
                              fill
                              className="object-cover grayscale opacity-90 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500"
                            />
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                              style={{
                                background: `linear-gradient(to top, ${isDark ? 'rgba(5,5,5,0.8)' : 'rgba(248,245,240,0.6)'}, transparent)`
                              }}
                            />
                            {pdf.is_bible_book && (
                              <div 
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"
                                style={{ 
                                  border: `1px solid ${theme.border}`,
                                  backgroundColor: isDark ? 'rgba(5,5,5,0.8)' : 'rgba(255,255,255,0.9)'
                                }}
                              >
                                <BookCheck className="w-4 h-4" style={{ color: theme.accent }} />
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 
                              className="text-lg line-clamp-2 tracking-wide transition-colors duration-300"
                              style={{ 
                                fontFamily: "'Italiana', serif", 
                                color: theme.text 
                              }}
                            >
                              {pdf.title}
                            </h3>
                          </div>

                          {pdf.author && (
                            <p 
                              className="text-sm font-light mb-4"
                              style={{ color: theme.textSecondary }}
                            >
                              by {pdf.author}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs mb-4" style={{ color: theme.textMuted }}>
                            <span>{pdf.username}</span>
                            <span>•</span>
                            <time>
                              {new Date(pdf.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: new Date(pdf.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                              })}
                            </time>
                          </div>

                          {pdf.themes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {pdf.themes.slice(0, 3).map((t) => (
                                <span 
                                  key={t}
                                  className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase transition-all duration-300"
                                  style={{ 
                                    border: `1px solid ${theme.border}`,
                                    color: theme.accent,
                                    backgroundColor: 'transparent'
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                              {pdf.themes.length > 3 && (
                                <span 
                                  className="px-3 py-1 text-[10px] tracking-[0.1em]"
                                  style={{ color: theme.textMuted }}
                                >
                                  +{pdf.themes.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
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
      themes: Array.isArray(p.themes) ? p.themes : typeof p.themes === 'string' ? p.themes.replace(/^{|}$/g, '').split(',').map((t: string) => t.trim()) : [],
    }));
    return { props: { pdfs: JSON.parse(JSON.stringify(parsed)) } };
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return { props: { pdfs: [] } };
  }
};
