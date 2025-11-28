import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Music, ArrowRight, Plus, BookOpen, Heart, Edit, Users } from 'lucide-react';
import { PublicJourneyListItem } from '@/types/journey';

interface JourneyCheckResponse {
  hasJourney: boolean;
  hasContent: boolean;
  profile: {
    id: number;
    title: string;
    subtitle: string | null;
    is_public: boolean;
  } | null;
}

interface PublicJourneysResponse {
  journeys: (PublicJourneyListItem & { is_liked: boolean })[];
  total: number;
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

export default function JourneysIndex() {
  const router = useRouter();
  const { user, getAuthToken } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [journeyStatus, setJourneyStatus] = useState<JourneyCheckResponse | null>(null);
  const [publicJourneys, setPublicJourneys] = useState<(PublicJourneyListItem & { is_liked: boolean })[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [likingJourneyId, setLikingJourneyId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#050505' : '#ffffff',
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
    selection: isDark ? '#ffffff' : '#161616',
    selectionText: isDark ? '#000000' : '#ffffff',
  };

  useEffect(() => {
    const checkUserJourney = async () => {
      if (!user) {
        setLoadingStatus(false);
        setJourneyStatus(null);
        return;
      }

      try {
        const token = await getAuthToken();
        const response = await fetch('/api/journeys/check', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setJourneyStatus(data);
        }
      } catch (error) {
        console.error('Error checking journey status:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkUserJourney();
  }, [user, getAuthToken]);

  useEffect(() => {
    const fetchPublicJourneys = async () => {
      try {
        const token = user ? await getAuthToken() : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('/api/journeys/public?limit=20', { headers });
        if (response.ok) {
          const data: PublicJourneysResponse = await response.json();
          setPublicJourneys(data.journeys);
        }
      } catch (error) {
        console.error('Error fetching public journeys:', error);
      } finally {
        setLoadingJourneys(false);
      }
    };

    fetchPublicJourneys();
  }, [user, getAuthToken]);

  const handleLikeJourney = async (journeyId: number, isCurrentlyLiked: boolean) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLikingJourneyId(journeyId);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/journeys/like', {
        method: isCurrentlyLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ journey_id: journeyId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPublicJourneys((prev) =>
          prev.map((j) =>
            j.id === journeyId
              ? { ...j, is_liked: data.liked, likes_count: data.likes_count }
              : j
          )
        );
      }
    } catch (error) {
      console.error('Error liking journey:', error);
    } finally {
      setLikingJourneyId(null);
    }
  };

  const renderUserButtons = () => {
    if (!user) {
      return (
        <Link href="/login">
          <Button 
            size="lg"
            className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium"
            style={{
              backgroundColor: theme.accent,
              color: isDark ? '#050505' : '#ffffff',
            }}
          >
            Sign In to Start
            <ArrowRight className="w-4 h-4 ml-3" />
          </Button>
        </Link>
      );
    }

    if (loadingStatus) {
      return (
        <div className="h-12 px-8 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 rounded-full"
            style={{ 
              border: `1px solid ${theme.border}`,
              borderTopColor: theme.accent
            }}
          />
        </div>
      );
    }

    if (!journeyStatus?.hasContent) {
      return (
        <Link href="/journeys/edit">
          <Button 
            size="lg"
            className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium"
            style={{
              backgroundColor: theme.accent,
              color: isDark ? '#050505' : '#ffffff',
            }}
          >
            <Plus className="w-4 h-4 mr-3" />
            Create Your Journey
          </Button>
        </Link>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <Link href="/journeys/edit">
          <Button 
            size="lg"
            className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium"
            style={{
              backgroundColor: theme.accent,
              color: isDark ? '#050505' : '#ffffff',
            }}
          >
            <Edit className="w-4 h-4 mr-3" />
            Edit Journey
          </Button>
        </Link>
        <Link href={`/journeys/${user.username}`}>
          <Button 
            variant="outline"
            size="lg"
            className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-colors"
            style={{
              borderColor: theme.borderHover,
              color: theme.text,
              backgroundColor: 'transparent',
            }}
          >
            View Your Journey
            <ArrowRight className="w-4 h-4 ml-3" />
          </Button>
        </Link>
      </div>
    );
  };

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Journeys | BibleChorus</title>
          <meta name="description" content="Discover musical journeys of faith through scripture songs" />
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
        <title>Journeys | BibleChorus</title>
        <meta name="description" content="Discover musical journeys of faith through scripture songs" />
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
                  {renderUserButtons()}
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
                    Musical Portfolios of Faith
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
                    Discover
                  </span>
                  <span 
                    className="block text-6xl md:text-7xl lg:text-8xl italic font-light"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text, opacity: 0.9 }}
                  >
                    Journeys
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
                  style={{ color: theme.textSecondary }}
                >
                  Explore musical portfolios that tell stories of faith through scripture songs. 
                  Each journey is a testimony of God's faithfulness through seasons of life.
                </motion.p>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto px-6 md:px-12 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div 
                className="grid md:grid-cols-3 gap-px max-w-5xl mx-auto"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500"
                  style={{ borderRight: `1px solid ${theme.border}` }}
                >
                  <div className="relative mb-6">
                    <div 
                      className="w-14 h-14 mx-auto flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <Music className="w-6 h-6" style={{ color: theme.accent }} />
                    </div>
                  </div>
                  <h3 
                    className="relative text-lg mb-3 tracking-wide"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    Curate Your Songs
                  </h3>
                  <p 
                    className="relative text-sm font-light leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    Organize your scripture songs into meaningful seasons that tell your story.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500"
                  style={{ borderRight: `1px solid ${theme.border}` }}
                >
                  <div className="relative mb-6">
                    <div 
                      className="w-14 h-14 mx-auto flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <BookOpen className="w-6 h-6" style={{ color: theme.accent }} />
                    </div>
                  </div>
                  <h3 
                    className="relative text-lg mb-3 tracking-wide"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    Share Your Story
                  </h3>
                  <p 
                    className="relative text-sm font-light leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    Add reflections, testimonies, and scripture references to each season.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500"
                >
                  <div className="relative mb-6">
                    <div 
                      className="w-14 h-14 mx-auto flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: theme.accent }} />
                    </div>
                  </div>
                  <h3 
                    className="relative text-lg mb-3 tracking-wide"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    Inspire Others
                  </h3>
                  <p 
                    className="relative text-sm font-light leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    Let others walk through your journey and be encouraged by God's faithfulness.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="container mx-auto px-6 md:px-12 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <div className="flex items-center gap-4 mb-12">
                <Users className="w-5 h-5" style={{ color: theme.accent }} />
                <h2 
                  className="text-xs tracking-[0.3em] uppercase"
                  style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                >
                  Public Journeys
                </h2>
              </div>

              {loadingJourneys ? (
                <div className="flex justify-center py-24">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      borderTopColor: theme.accent
                    }}
                  />
                </div>
              ) : publicJourneys.length === 0 ? (
                <div 
                  className="text-center py-24"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <div 
                    className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
                    style={{ border: `1px solid ${theme.border}` }}
                  >
                    <Music className="w-6 h-6" style={{ color: theme.textSecondary }} />
                  </div>
                  <p 
                    className="text-xl mb-3"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    No Public Journeys Yet
                  </p>
                  <p 
                    className="text-sm font-light"
                    style={{ color: theme.textSecondary }}
                  >
                    Be the first to share your musical journey!
                  </p>
                </div>
              ) : (
                <div 
                  className="grid gap-px md:grid-cols-2 lg:grid-cols-3"
                  style={{ 
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.hoverBg
                  }}
                >
                  {publicJourneys.map((journey, index) => (
                    <motion.div
                      key={journey.id}
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
                      <Link href={`/journeys/${journey.username}`} className="block">
                        <div 
                          className="p-6 md:p-8 transition-colors duration-500"
                          style={{ backgroundColor: theme.bgCard }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.hoverBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme.bgCard;
                          }}
                        >
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div 
                                className="relative w-10 h-10 overflow-hidden flex items-center justify-center"
                                style={{ 
                                  border: `1px solid ${theme.border}`,
                                  backgroundColor: theme.bgAlt
                                }}
                              >
                                {journey.profile_image_url ? (
                                  <Image
                                    src={journey.profile_image_url}
                                    alt={journey.username}
                                    fill
                                    className="object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500"
                                  />
                                ) : (
                                  <span 
                                    className="text-sm"
                                    style={{ fontFamily: "'Italiana', serif", color: theme.accent, opacity: 0.8 }}
                                  >
                                    {journey.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span 
                                className="text-xs tracking-[0.15em] uppercase transition-colors duration-300"
                                style={{ color: theme.textSecondary }}
                              >
                                @{journey.username}
                              </span>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLikeJourney(journey.id, journey.is_liked);
                              }}
                              disabled={likingJourneyId === journey.id}
                              className="flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase transition-all duration-300"
                              style={{
                                border: `1px solid ${journey.is_liked ? `${theme.accent}66` : theme.cardBorder}`,
                                color: journey.is_liked ? theme.accent : theme.textMuted,
                                backgroundColor: journey.is_liked ? `${theme.accent}14` : 'transparent',
                              }}
                            >
                              <Heart
                                className={`w-3 h-3 ${journey.is_liked ? 'fill-current' : ''} ${
                                  likingJourneyId === journey.id ? 'animate-pulse' : ''
                                }`}
                              />
                              <span>{journey.likes_count}</span>
                            </button>
                          </div>

                          <h3 
                            className="text-xl mb-2 line-clamp-1 transition-colors duration-300"
                            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                          >
                            {journey.title}
                          </h3>
                          {journey.subtitle && (
                            <p 
                              className="text-sm mb-6 line-clamp-2 font-light leading-relaxed"
                              style={{ color: theme.textSecondary, opacity: 0.8 }}
                            >
                              {journey.subtitle}
                            </p>
                          )}

                          <div 
                            className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase"
                            style={{ color: theme.textMuted }}
                          >
                            <Music className="w-3.5 h-3.5" />
                            <span>{journey.song_count} {journey.song_count === 1 ? 'song' : 'songs'}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
