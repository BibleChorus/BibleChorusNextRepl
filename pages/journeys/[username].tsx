import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import axios from 'axios';
import { JourneyWithSeasons } from '@/types/journey';
import { JourneyHero } from '@/components/JourneysPage/JourneyHero';
import { JourneyTimeline } from '@/components/JourneysPage/JourneyTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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

  if (error) {
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

  if (!journey) return null;

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
          <JourneyTimeline journey={journey} isPreview={isOwner} />
        </div>
      </div>
    </>
  );
}
