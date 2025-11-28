import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from 'next-themes';
import { JourneyWithSeasons, Season } from '@/types/journey';
import { JourneyHero } from '@/components/JourneysPage/JourneyHero';
import { JourneyTimeline } from '@/components/JourneysPage/JourneyTimeline';
import { 
  FilmGrain, 
  CustomCursor, 
  AmbientOrbs, 
  ScrollProgress 
} from '@/components/JourneysPage/JourneyEffects';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Pencil, Lock, ArrowLeft, Plus, Music, ChevronDown, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SeasonsDropdownProps {
  seasons: Season[];
  isMobile?: boolean;
  theme: {
    bg: string;
    bgAlt: string;
    bgCard: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    border: string;
    borderHover: string;
  };
}

const SeasonsDropdown: React.FC<SeasonsDropdownProps> = ({ seasons, isMobile = false, theme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortedSeasons = [...seasons].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB;
  });

  const scrollToSeason = (seasonId: number) => {
    setIsOpen(false);
    window.location.hash = `season-${seasonId}`;
  };

  if (seasons.length === 0) return null;

  if (isMobile) {
    return (
      <>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg md:hidden"
          style={{ backgroundColor: theme.accent, color: theme.bg }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Calendar className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[70vh] overflow-hidden md:hidden"
                style={{ backgroundColor: theme.bgAlt, borderTop: `1px solid ${theme.border}` }}
              >
                <div className="flex items-center justify-center py-3">
                  <div className="w-10 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
                </div>
                <div className="px-4 pb-2">
                  <h3 
                    className="text-sm tracking-[0.2em] uppercase mb-4"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                  >
                    Jump to Season
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-[calc(70vh-80px)] pb-8">
                  {sortedSeasons.map((season) => {
                    const year = new Date(season.start_date).getFullYear();
                    return (
                      <button
                        key={season.id}
                        onClick={() => scrollToSeason(season.id)}
                        className="w-full px-6 py-4 flex items-center gap-4 transition-colors text-left"
                        style={{ 
                          ['--hover-bg' as string]: theme.border
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.border}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span 
                          className="text-lg font-light min-w-[60px]"
                          style={{ fontFamily: "'Italiana', serif", color: theme.accent }}
                        >
                          {year}
                        </span>
                        <div className="flex-1">
                          <span 
                            className="text-base font-light block"
                            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                          >
                            {season.title}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: theme.textSecondary }} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-light transition-colors hover-trigger"
        style={{ color: theme.text }}
        onMouseEnter={(e) => e.currentTarget.style.color = theme.textSecondary}
        onMouseLeave={(e) => e.currentTarget.style.color = theme.text}
      >
        <Calendar className="w-3 h-3" />
        <span>Seasons</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-4 z-50 min-w-[280px] backdrop-blur-xl rounded-none overflow-hidden"
              style={{ backgroundColor: `${theme.bgAlt}f2`, border: `1px solid ${theme.border}` }}
            >
              <div className="py-2">
                {sortedSeasons.map((season, index) => {
                  const year = new Date(season.start_date).getFullYear();
                  return (
                    <button
                      key={season.id}
                      onClick={() => scrollToSeason(season.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 transition-colors text-left group"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.border}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span 
                        className="text-sm font-light min-w-[50px]"
                        style={{ fontFamily: "'Italiana', serif", color: `${theme.accent}99` }}
                      >
                        {year}
                      </span>
                      <div className="flex-1">
                        <span 
                          className="text-sm font-light block transition-colors"
                          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                        >
                          {season.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function JourneyPage() {
  const router = useRouter();
  const { username } = router.query;
  const { user, getAuthToken } = useAuth();
  const { setIsOpen } = useSidebar();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [journey, setJourney] = useState<JourneyWithSeasons | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.username === username;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#0f0f0f' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  };

  useEffect(() => {
    setIsOpen(false);
    
    const style = document.createElement('style');
    style.id = 'journey-fullscreen-style';
    style.textContent = `
      body, html { background-color: ${theme.bg} !important; }
      .lg\\:ml-16, .lg\\:ml-64, [class*="lg:ml-"] { margin-left: 0 !important; }
      .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
      .pt-20 { padding-top: 0 !important; }
      .pb-8 { padding-bottom: 0 !important; }
      .min-h-screen.bg-background { background-color: ${theme.bg} !important; }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('journey-fullscreen-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [setIsOpen, theme.bg]);

  useEffect(() => {
    if (!username) return;

    const fetchJourney = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getAuthToken();
        const response = await axios.get(`/api/journeys/${username}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setJourney(response.data);
      } catch (err: any) {
        console.error('Error fetching journey:', err);
        if (err.response?.status === 404) {
          setError('Journey not found');
        } else if (err.response?.status === 403) {
          setError('This journey is private');
        } else {
          setError('Failed to load journey');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourney();
  }, [username, getAuthToken]);

  if (!mounted) {
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor: '#050505', fontFamily: "'Manrope', sans-serif" }}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading Journey... | BibleChorus</title>
        </Head>
        <div 
          className="min-h-screen flex items-center justify-center fixed inset-0"
          style={{ 
            backgroundColor: theme.bg, 
            fontFamily: "'Manrope', sans-serif" 
          }}
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 rounded-full border-2"
              style={{ borderColor: theme.border, borderTopColor: theme.accent }}
            />
            <p className="text-sm tracking-widest uppercase" style={{ color: theme.textSecondary }}>Loading journey...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !isOwner) {
    return (
      <>
        <Head>
          <title>{error} | BibleChorus</title>
        </Head>
        <div 
          className="min-h-screen flex items-center justify-center fixed inset-0"
          style={{ 
            backgroundColor: theme.bg, 
            fontFamily: "'Manrope', sans-serif" 
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="mb-8">
              <div 
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <Lock className="w-8 h-8" style={{ color: theme.textSecondary }} />
              </div>
            </div>
            <h1 
              className="text-3xl mb-4"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              {error}
            </h1>
            <p className="mb-8 font-light" style={{ color: theme.textSecondary }}>
              {error === 'This journey is private' 
                ? 'The owner has not made this journey public yet.'
                : 'We could not find the journey you are looking for.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                style={{ 
                  borderColor: theme.borderHover, 
                  color: theme.text,
                  backgroundColor: 'transparent'
                }}
                className="hover:bg-opacity-5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Link href="/journeys">
                <Button style={{ backgroundColor: theme.accent, color: theme.bg }}>
                  Explore Journeys
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  if ((error || !journey) && isOwner) {
    return (
      <>
        <Head>
          <title>Start Your Journey | BibleChorus</title>
        </Head>
        <div 
          className="min-h-screen relative overflow-hidden fixed inset-0"
          style={{ 
            backgroundColor: theme.bg, 
            fontFamily: "'Manrope', sans-serif" 
          }}
        >
          <FilmGrain />
          <AmbientOrbs />
          
          <div className="relative z-10 container mx-auto px-4 py-24 flex items-center justify-center min-h-screen">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xs tracking-[0.5em] mb-8 uppercase"
                style={{ color: theme.accent }}
              >
                Your Sonic Archive Awaits
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl mb-6 tracking-tight"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                Begin Your<br />
                <span className="italic font-light">Journey</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg mb-12 max-w-md mx-auto font-light leading-relaxed"
                style={{ color: theme.textSecondary }}
              >
                This is your personal space to showcase your musical testimony. 
                Create seasons, add your songs, and share your story of faith.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid md:grid-cols-3 gap-6 mb-12"
              >
                {[
                  { title: 'Create Seasons', desc: 'Organize songs into meaningful chapters' },
                  { title: 'Add Reflections', desc: 'Share testimonies and scripture' },
                  { title: 'Share Your Story', desc: 'Inspire others with your journey' },
                ].map((item, i) => (
                  <div 
                    key={item.title}
                    className="p-6 rounded-none"
                    style={{ border: `1px solid ${theme.border}` }}
                  >
                    <h3 className="mb-2 text-sm tracking-wide" style={{ color: theme.text }}>{item.title}</h3>
                    <p className="text-xs font-light" style={{ color: theme.textSecondary }}>{item.desc}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/journeys/edit">
                  <Button 
                    size="lg"
                    className="h-14 px-10 font-medium text-sm tracking-widest uppercase rounded-none"
                    style={{ backgroundColor: theme.accent, color: theme.bg }}
                  >
                    <Plus className="w-4 h-4 mr-3" />
                    Begin
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  if (!journey) return null;

  const hasSeasons = journey.seasons && journey.seasons.length > 0;

  return (
    <>
      <Head>
        <title>{journey.title} | {journey.username}'s Journey | BibleChorus</title>
        <meta name="description" content={journey.subtitle || `Explore ${journey.username}'s musical journey through scripture songs`} />
        <meta property="og:title" content={`${journey.title} | ${journey.username}'s Journey`} />
        <meta property="og:description" content={journey.subtitle || `Explore ${journey.username}'s musical journey`} />
        <meta property="og:type" content="profile" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div 
        ref={containerRef}
        className="min-h-screen selection:bg-white selection:text-black relative"
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
          .journey-page ::-webkit-scrollbar {
            width: 6px;
          }
          .journey-page ::-webkit-scrollbar-track {
            background: ${theme.bgAlt};
          }
          .journey-page ::-webkit-scrollbar-thumb {
            background: ${isDark ? '#333' : '#ccc'};
            border-radius: 3px;
          }
        `}</style>

        <FilmGrain />
        <CustomCursor />
        <AmbientOrbs />
        <ScrollProgress containerRef={containerRef as React.RefObject<HTMLElement>} />

        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-28 right-8 z-50"
          >
            <Link href="/journeys/edit">
              <Button
                className="backdrop-blur-xl rounded-none text-xs tracking-widest uppercase px-6"
                style={{ 
                  backgroundColor: `${theme.bgCard}cc`,
                  border: `1px solid ${theme.border}`,
                  color: theme.text
                }}
              >
                <Pencil className="w-3 h-3 mr-2" />
                Edit
              </Button>
            </Link>
          </motion.div>
        )}

        <nav className="fixed top-16 w-full px-8 py-4 flex justify-between items-center z-40 pointer-events-none">
          <Link 
            href="/journeys" 
            className="text-xl tracking-widest hover-trigger pointer-events-auto transition-colors"
            style={{ fontFamily: "'Italiana', serif", color: `${theme.text}cc` }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.text}
            onMouseLeave={(e) => e.currentTarget.style.color = `${theme.text}cc`}
          >
            JOURNEYS.
          </Link>
          <div className="hidden md:flex gap-8 items-center pointer-events-auto">
            <SeasonsDropdown seasons={journey.seasons || []} theme={theme} />
          </div>
        </nav>

        <SeasonsDropdown seasons={journey.seasons || []} isMobile={true} theme={theme} />

        <div className="journey-page">
          <JourneyHero journey={journey} />
          
          <main id="seasons" className="relative pb-32">
            {hasSeasons ? (
              <JourneyTimeline journey={journey} isPreview={isOwner} />
            ) : isOwner ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-32"
              >
                <div 
                  className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Music className="w-8 h-8" style={{ color: theme.textSecondary }} />
                </div>
                <h2 
                  className="text-3xl mb-4"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  Your Journey Awaits
                </h2>
                <p className="mb-8 max-w-md mx-auto font-light" style={{ color: theme.textSecondary }}>
                  Start by creating your first season to showcase your musical testimony.
                </p>
                <Link href="/journeys/edit">
                  <Button 
                    size="lg"
                    className="h-12 px-8 rounded-none text-xs tracking-widest uppercase"
                    style={{ backgroundColor: theme.accent, color: theme.bg }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Season
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-32"
              >
                <div 
                  className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Music className="w-6 h-6" style={{ color: theme.textSecondary }} />
                </div>
                <h2 
                  className="text-2xl mb-4"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  No Seasons Yet
                </h2>
                <p className="font-light" style={{ color: theme.textSecondary }}>
                  This journey doesn't have any seasons to display yet.
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
