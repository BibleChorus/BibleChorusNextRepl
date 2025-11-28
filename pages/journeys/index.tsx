import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
      className="fixed inset-0 pointer-events-none opacity-0 dark:opacity-[0.015]"
      style={{
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

const AmbientOrbsOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-full h-full rounded-full bg-indigo-400/20 dark:bg-gold/[0.06]" />
      </motion.div>
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <div className="w-full h-full rounded-full bg-purple-400/20 dark:bg-mist/[0.04]" />
      </motion.div>
      <motion.div 
        className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full"
        style={{
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      >
        <div className="w-full h-full rounded-full bg-pink-400/15 dark:bg-silk/[0.02]" />
      </motion.div>
    </div>
  );
};

export default function JourneysIndex() {
  const router = useRouter();
  const { user, getAuthToken } = useAuth();
  const [journeyStatus, setJourneyStatus] = useState<JourneyCheckResponse | null>(null);
  const [publicJourneys, setPublicJourneys] = useState<(PublicJourneyListItem & { is_liked: boolean })[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [likingJourneyId, setLikingJourneyId] = useState<number | null>(null);

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
            className="h-12 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 dark:from-gold dark:to-gold dark:hover:from-gold/90 dark:hover:to-gold/90 text-white dark:text-void rounded-xl dark:rounded-none text-xs tracking-[0.15em] dark:tracking-[0.2em] uppercase font-medium"
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
            className="w-5 h-5 rounded-full border border-indigo-200 dark:border-white/10 border-t-indigo-500 dark:border-t-gold"
          />
        </div>
      );
    }

    if (!journeyStatus?.hasContent) {
      return (
        <Link href="/journeys/edit">
          <Button 
            size="lg"
            className="h-12 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 dark:from-gold dark:to-gold dark:hover:from-gold/90 dark:hover:to-gold/90 text-white dark:text-void rounded-xl dark:rounded-none text-xs tracking-[0.15em] dark:tracking-[0.2em] uppercase font-medium"
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
            className="h-12 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 dark:from-gold dark:to-gold dark:hover:from-gold/90 dark:hover:to-gold/90 text-white dark:text-void rounded-xl dark:rounded-none text-xs tracking-[0.15em] dark:tracking-[0.2em] uppercase font-medium"
          >
            <Edit className="w-4 h-4 mr-3" />
            Edit Journey
          </Button>
        </Link>
        <Link href={`/journeys/${user.username}`}>
          <Button 
            variant="outline"
            size="lg"
            className="h-12 px-8 rounded-xl dark:rounded-none text-xs tracking-[0.15em] dark:tracking-[0.2em] uppercase font-medium border-2 border-indigo-200 dark:border-white/20 text-slate-700 dark:text-silk hover:bg-indigo-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white"
          >
            View Your Journey
            <ArrowRight className="w-4 h-4 ml-3" />
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Journeys | BibleChorus</title>
        <meta name="description" content="Discover musical journeys of faith through scripture songs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen relative selection:bg-indigo-500 dark:selection:bg-white selection:text-white dark:selection:text-black bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-[#050505] dark:via-[#050505] dark:to-[#050505]">
        <AmbientOrbsOverlay />
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
                  <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full dark:rounded-none text-xs tracking-[0.3em] dark:tracking-[0.5em] uppercase font-medium bg-gradient-to-r from-indigo-400/10 via-purple-400/10 to-pink-400/10 dark:from-transparent dark:via-transparent dark:to-transparent backdrop-blur-md dark:backdrop-blur-none border border-indigo-200/50 dark:border-transparent text-indigo-600 dark:text-gold">
                    <Sparkles className="w-4 h-4 dark:hidden" />
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
                    className="block text-6xl md:text-7xl lg:text-8xl font-bold dark:font-normal tracking-tight mb-2 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-silk dark:via-silk dark:to-silk bg-clip-text text-transparent"
                    style={{ fontFamily: "'Italiana', serif" }}
                  >
                    Discover
                  </span>
                  <span 
                    className="block text-6xl md:text-7xl lg:text-8xl font-bold dark:font-light italic bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-silk/90 dark:via-silk/90 dark:to-silk/90 bg-clip-text text-transparent"
                    style={{ fontFamily: "'Italiana', serif" }}
                  >
                    Journeys
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-lg md:text-xl text-slate-600 dark:text-mist max-w-2xl mx-auto leading-relaxed font-light"
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
              <div className="grid md:grid-cols-3 gap-6 dark:gap-px max-w-5xl mx-auto dark:border dark:border-white/10">
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500 bg-white/70 dark:bg-transparent backdrop-blur-xl dark:backdrop-blur-none rounded-2xl dark:rounded-none border border-slate-200/50 dark:border-r dark:border-white/10 dark:border-y-0 dark:border-l-0 hover:shadow-xl dark:hover:shadow-none dark:hover:bg-white/[0.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-transparent rounded-2xl dark:rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative mb-6">
                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-transparent dark:to-transparent rounded-xl dark:rounded-none dark:border dark:border-white/10 flex items-center justify-center shadow-lg dark:shadow-none">
                      <Music className="w-6 h-6 text-white dark:text-gold" />
                    </div>
                  </div>
                  <h3 
                    className="relative text-lg font-semibold dark:font-normal text-slate-800 dark:text-silk mb-3 tracking-wide"
                    style={{ fontFamily: "'Italiana', serif" }}
                  >
                    Curate Your Songs
                  </h3>
                  <p className="relative text-sm text-slate-600 dark:text-mist font-light leading-relaxed">
                    Organize your scripture songs into meaningful seasons that tell your story.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500 bg-white/70 dark:bg-transparent backdrop-blur-xl dark:backdrop-blur-none rounded-2xl dark:rounded-none border border-slate-200/50 dark:border-r dark:border-white/10 dark:border-y-0 dark:border-l-0 hover:shadow-xl dark:hover:shadow-none dark:hover:bg-white/[0.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent rounded-2xl dark:rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative mb-6">
                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 dark:from-transparent dark:to-transparent rounded-xl dark:rounded-none dark:border dark:border-white/10 flex items-center justify-center shadow-lg dark:shadow-none">
                      <BookOpen className="w-6 h-6 text-white dark:text-gold" />
                    </div>
                  </div>
                  <h3 
                    className="relative text-lg font-semibold dark:font-normal text-slate-800 dark:text-silk mb-3 tracking-wide"
                    style={{ fontFamily: "'Italiana', serif" }}
                  >
                    Share Your Story
                  </h3>
                  <p className="relative text-sm text-slate-600 dark:text-mist font-light leading-relaxed">
                    Add reflections, testimonies, and scripture references to each season.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative p-8 md:p-10 text-center transition-all duration-500 bg-white/70 dark:bg-transparent backdrop-blur-xl dark:backdrop-blur-none rounded-2xl dark:rounded-none border border-slate-200/50 dark:border-0 hover:shadow-xl dark:hover:shadow-none dark:hover:bg-white/[0.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-transparent rounded-2xl dark:rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative mb-6">
                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-pink-500 to-rose-500 dark:from-transparent dark:to-transparent rounded-xl dark:rounded-none dark:border dark:border-white/10 flex items-center justify-center shadow-lg dark:shadow-none">
                      <Sparkles className="w-6 h-6 text-white dark:text-gold" />
                    </div>
                  </div>
                  <h3 
                    className="relative text-lg font-semibold dark:font-normal text-slate-800 dark:text-silk mb-3 tracking-wide"
                    style={{ fontFamily: "'Italiana', serif" }}
                  >
                    Inspire Others
                  </h3>
                  <p className="relative text-sm text-slate-600 dark:text-mist font-light leading-relaxed">
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
                <Users className="w-5 h-5 text-indigo-500 dark:text-gold" />
                <h2 className="text-2xl md:text-3xl font-bold dark:font-normal text-slate-800 dark:text-mist dark:text-xs dark:tracking-[0.3em] dark:uppercase">
                  <span className="dark:hidden">Public Journeys</span>
                  <span className="hidden dark:inline">Public Journeys</span>
                </h2>
              </div>

              {loadingJourneys ? (
                <div className="flex justify-center py-24">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-2 dark:border border-indigo-200 dark:border-white/10 border-t-indigo-500 dark:border-t-gold"
                  />
                </div>
              ) : publicJourneys.length === 0 ? (
                <div className="text-center py-24 bg-white/50 dark:bg-transparent rounded-2xl dark:rounded-none border border-slate-200/50 dark:border-white/10">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-transparent dark:to-transparent rounded-xl dark:rounded-none dark:border dark:border-white/10 flex items-center justify-center shadow-lg dark:shadow-none">
                    <Music className="w-6 h-6 text-white dark:text-mist" />
                  </div>
                  <p 
                    className="text-xl font-semibold dark:font-normal text-slate-800 dark:text-silk mb-3"
                    style={{ fontFamily: "'Italiana', serif" }}
                  >
                    No Public Journeys Yet
                  </p>
                  <p className="text-sm text-slate-600 dark:text-mist font-light">
                    Be the first to share your musical journey!
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 dark:gap-px md:grid-cols-2 lg:grid-cols-3 dark:border dark:border-white/10 dark:bg-white/[0.02]">
                  {publicJourneys.map((journey, index) => (
                    <motion.div
                      key={journey.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.05 * Math.min(index, 6) }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="group relative bg-white dark:bg-[#050505] rounded-2xl dark:rounded-none shadow-lg dark:shadow-none border border-slate-200/50 dark:border-b dark:border-r dark:border-white/[0.05] dark:last:border-r-0 md:dark:[&:nth-child(2n)]:border-r-0 lg:dark:[&:nth-child(2n)]:border-r lg:dark:[&:nth-child(3n)]:border-r-0 overflow-hidden hover:shadow-xl dark:hover:shadow-none transition-all duration-300"
                    >
                      <Link href={`/journeys/${journey.username}`} className="block">
                        <div className="p-6 md:p-8 transition-colors duration-500 dark:group-hover:bg-white/[0.02]">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 overflow-hidden rounded-full dark:rounded-none border-2 dark:border border-slate-200 dark:border-white/10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-[#0a0a0a] dark:to-[#0a0a0a]">
                                {journey.profile_image_url ? (
                                  <Image
                                    src={journey.profile_image_url}
                                    alt={journey.username}
                                    fill
                                    className="object-cover dark:grayscale dark:opacity-80 dark:group-hover:opacity-100 dark:group-hover:grayscale-0 transition-all duration-500"
                                  />
                                ) : (
                                  <span 
                                    className="text-white dark:text-gold/80 text-sm font-medium dark:font-normal"
                                    style={{ fontFamily: "'Italiana', serif" }}
                                  >
                                    {journey.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs tracking-wide dark:tracking-[0.15em] uppercase text-slate-500 dark:text-mist group-hover:text-indigo-500 dark:group-hover:text-silk transition-colors duration-300">
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
                              className={`flex items-center gap-2 px-3 py-1.5 text-xs tracking-wider dark:tracking-[0.15em] uppercase transition-all duration-300 rounded-full dark:rounded-none border ${
                                journey.is_liked
                                  ? 'border-pink-200 dark:border-gold/40 text-pink-500 dark:text-gold bg-pink-50 dark:bg-gold/[0.08]'
                                  : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-mist/60 hover:border-pink-200 dark:hover:border-white/20 hover:text-pink-500 dark:hover:text-mist'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${journey.is_liked ? 'fill-current' : ''} ${
                                  likingJourneyId === journey.id ? 'animate-pulse' : ''
                                }`}
                              />
                              <span>{journey.likes_count}</span>
                            </button>
                          </div>

                          <h3 
                            className="text-xl font-semibold dark:font-normal text-slate-800 dark:text-silk mb-2 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors duration-300 line-clamp-1"
                            style={{ fontFamily: "'Italiana', serif" }}
                          >
                            {journey.title}
                          </h3>
                          {journey.subtitle && (
                            <p className="text-sm text-slate-600 dark:text-mist/80 mb-6 line-clamp-2 font-light leading-relaxed">
                              {journey.subtitle}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-mist/70 tracking-wide dark:tracking-[0.15em] uppercase">
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
