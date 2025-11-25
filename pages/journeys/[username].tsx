import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';
import { JourneyWithSeasons } from '@/types/journey';
import { JourneyHero } from '@/components/JourneysPage/JourneyHero';
import { JourneyTimeline } from '@/components/JourneysPage/JourneyTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Pencil, Lock, ArrowLeft, Plus, Sparkles, Music, BookOpen } from 'lucide-react';

export default function JourneyPage() {
  const router = useRouter();
  const { username } = router.query;
  const { user } = useAuth();
  const [journey, setJourney] = useState<JourneyWithSeasons | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.username === username;

  useEffect(() => {
    if (!username) return;

    const fetchJourney = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/journeys/${username}`);
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
  }, [username]);

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading Journey... | BibleChorus</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500"
            />
            <p className="text-slate-600 dark:text-slate-400">Loading journey...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-slate-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              {error}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              {error === 'This journey is private' 
                ? 'The owner has not made this journey public yet.'
                : 'We could not find the journey you are looking for.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Link href="/journeys">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
          </div>

          <div className="relative z-10 container mx-auto px-4 py-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-400/12 via-purple-400/12 to-pink-400/12 backdrop-blur-md border border-indigo-400/14 shadow-lg">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent font-semibold">
                    Your Musical Journey Awaits
                  </span>
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-slate-100 mb-6"
              >
                Welcome to Your
                <span className="block bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Journey
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-xl mx-auto"
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
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/40">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Create Seasons</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Organize your songs into meaningful chapters of your journey.
                  </p>
                </div>

                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/40">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Add Reflections</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Share testimonies and scripture references for each season.
                  </p>
                </div>

                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/40">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Share Your Story</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Inspire others with your musical journey of faith.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/journeys/edit">
                  <Button 
                    size="lg"
                    className="h-14 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold text-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Start Creating Your Journey
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 right-4 z-50"
          >
            <Link href="/journeys/edit">
              <Button
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/40 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-lg"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Journey
              </Button>
            </Link>
          </motion.div>
        )}

        <JourneyHero journey={journey} />
        
        <div className="container mx-auto px-4 py-16 lg:py-24">
          {hasSeasons ? (
            <JourneyTimeline journey={journey} isPreview={isOwner} />
          ) : isOwner ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="relative mb-8 inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
                <div className="relative p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/40">
                  <Sparkles className="w-16 h-16 text-indigo-500" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-300 mb-4">
                Your Journey Awaits
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Start by creating your first season to showcase your musical testimony.
              </p>
              <Link href="/journeys/edit">
                <Button 
                  size="lg"
                  className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Season
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Music className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">
                No Seasons Yet
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                This journey doesn't have any seasons to display yet.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
