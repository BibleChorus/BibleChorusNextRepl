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
            className="h-14 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold text-lg"
          >
            Sign In to Start
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      );
    }

    if (loadingStatus) {
      return (
        <div className="h-14 px-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (!journeyStatus?.hasContent) {
      return (
        <Link href="/journeys/edit">
          <Button 
            size="lg"
            className="h-14 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your Journey
          </Button>
        </Link>
      );
    }

    return (
      <>
        <Link href="/journeys/edit">
          <Button 
            size="lg"
            className="h-14 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold text-lg"
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit Journey
          </Button>
        </Link>
        <Link href={`/journeys/${user.username}`}>
          <Button 
            variant="outline"
            size="lg"
            className="h-14 px-8 rounded-xl font-semibold text-lg border-2"
          >
            View Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </>
    );
  };

  const getThemeColorClasses = (themeColor: string) => {
    const colors: Record<string, string> = {
      indigo: 'from-indigo-500 to-purple-500',
      purple: 'from-purple-500 to-pink-500',
      pink: 'from-pink-500 to-rose-500',
      blue: 'from-blue-500 to-indigo-500',
      teal: 'from-teal-500 to-cyan-500',
      green: 'from-green-500 to-teal-500',
      amber: 'from-amber-500 to-orange-500',
      rose: 'from-rose-500 to-pink-500',
    };
    return colors[themeColor] || colors.indigo;
  };

  return (
    <>
      <Head>
        <title>Journeys | BibleChorus</title>
        <meta name="description" content="Discover musical journeys of faith through scripture songs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/[0.08] via-purple-400/[0.06] to-pink-400/[0.08] dark:from-indigo-400/[0.13] dark:via-purple-400/[0.1] dark:to-pink-400/[0.13]"></div>
            <motion.div 
              animate={{ 
                x: [0, 30, 0],
                y: [0, -50, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 -left-20 w-[500px] h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl"
            />
            <motion.div 
              animate={{ 
                x: [0, -20, 0],
                y: [0, 30, 0],
                scale: [1, 1.15, 1]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
              className="absolute top-20 -right-20 w-[400px] h-[400px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl"
            />
            <motion.div 
              animate={{ 
                x: [0, 40, 0],
                y: [0, 40, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 10 }}
              className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl"
            />
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="flex justify-end mb-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3"
              >
                {renderUserButtons()}
              </motion.div>
            </div>

            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-400/12 via-purple-400/12 to-pink-400/12 dark:from-indigo-400/16 dark:via-purple-400/16 dark:to-pink-400/16 backdrop-blur-md border border-indigo-400/14 dark:border-indigo-400/18 shadow-lg">
                  <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-semibold">
                    Musical Portfolios of Faith
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Discover</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Journeys
                  </span>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full origin-left"
                  />
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8"
              >
                Explore musical portfolios that tell stories of faith through scripture songs. 
                Each journey is a testimony of God's faithfulness through seasons of life.
              </motion.p>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="absolute top-16 right-16 hidden xl:block"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-400/16 to-purple-400/16 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute bottom-16 left-16 hidden xl:block"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400/16 to-pink-400/16 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
          </motion.div>
        </motion.div>

        <div className="container mx-auto px-4 -mt-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="relative text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Curate Your Songs
                </h3>
                <p className="relative text-slate-600 dark:text-slate-400">
                  Organize your scripture songs into meaningful seasons that tell your story.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="relative text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Share Your Story
                </h3>
                <p className="relative text-slate-600 dark:text-slate-400">
                  Add reflections, testimonies, and scripture references to each season.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="relative text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Inspire Others
                </h3>
                <p className="relative text-slate-600 dark:text-slate-400">
                  Let others walk through your journey and be encouraged by God's faithfulness.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">
                Public Journeys
              </h2>
            </div>

            {loadingJourneys ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : publicJourneys.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  No public journeys yet. Be the first to share your musical journey!
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publicJourneys.map((journey, index) => (
                  <motion.div
                    key={journey.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div className={`h-2 bg-gradient-to-r ${getThemeColorClasses(journey.theme_color)}`} />
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <Link href={`/journeys/${journey.username}`} className="flex items-center gap-3 group/user">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            {journey.profile_image_url ? (
                              <Image
                                src={journey.profile_image_url}
                                alt={journey.username}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-sm">
                                {journey.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover/user:text-indigo-500 transition-colors">
                            @{journey.username}
                          </span>
                        </Link>
                        
                        <button
                          onClick={() => handleLikeJourney(journey.id, journey.is_liked)}
                          disabled={likingJourneyId === journey.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            journey.is_liked
                              ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${journey.is_liked ? 'fill-current' : ''} ${
                              likingJourneyId === journey.id ? 'animate-pulse' : ''
                            }`}
                          />
                          <span>{journey.likes_count}</span>
                        </button>
                      </div>

                      <Link href={`/journeys/${journey.username}`}>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-indigo-500 transition-colors line-clamp-1">
                          {journey.title}
                        </h3>
                        {journey.subtitle && (
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                            {journey.subtitle}
                          </p>
                        )}
                      </Link>

                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Music className="w-4 h-4" />
                          <span>{journey.song_count} {journey.song_count === 1 ? 'song' : 'songs'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
