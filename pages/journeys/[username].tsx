import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';
import { JourneyWithSeasons } from '@/types/journey';
import { JourneyHero } from '@/components/JourneysPage/JourneyHero';
import { JourneyTimeline } from '@/components/JourneysPage/JourneyTimeline';
import { 
  FilmGrain, 
  CustomCursor, 
  AmbientOrbs, 
  ScrollProgress 
} from '@/components/JourneysPage/JourneyEffects';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Pencil, Lock, ArrowLeft, Plus, Music } from 'lucide-react';

export default function JourneyPage() {
  const router = useRouter();
  const { username } = router.query;
  const { user, getAuthToken } = useAuth();
  const [journey, setJourney] = useState<JourneyWithSeasons | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.username === username;

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

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading Journey... | BibleChorus</title>
        </Head>
        <div 
          className="min-h-screen flex items-center justify-center"
          style={{ 
            backgroundColor: '#050505', 
            fontFamily: "'Manrope', sans-serif" 
          }}
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-white/10 border-t-gold"
            />
            <p className="text-mist text-sm tracking-widest uppercase">Loading journey...</p>
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
          className="min-h-screen flex items-center justify-center"
          style={{ 
            backgroundColor: '#050505', 
            fontFamily: "'Manrope', sans-serif" 
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto rounded-full border border-white/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-mist" />
              </div>
            </div>
            <h1 
              className="text-3xl text-silk mb-4"
              style={{ fontFamily: "'Italiana', serif" }}
            >
              {error}
            </h1>
            <p className="text-mist mb-8 font-light">
              {error === 'This journey is private' 
                ? 'The owner has not made this journey public yet.'
                : 'We could not find the journey you are looking for.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="border-white/20 text-silk hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Link href="/journeys">
                <Button className="bg-gold hover:bg-gold/90 text-void">
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
          className="min-h-screen relative overflow-hidden"
          style={{ 
            backgroundColor: '#050505', 
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
                className="text-xs tracking-[0.5em] text-gold mb-8 uppercase"
              >
                Your Sonic Archive Awaits
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl text-silk mb-6 tracking-tight"
                style={{ fontFamily: "'Italiana', serif" }}
              >
                Begin Your<br />
                <span className="italic font-light">Journey</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-mist mb-12 max-w-md mx-auto font-light leading-relaxed"
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
                    className="p-6 border border-white/5 rounded-none"
                  >
                    <h3 className="text-silk mb-2 text-sm tracking-wide">{item.title}</h3>
                    <p className="text-xs text-mist font-light">{item.desc}</p>
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
                    className="h-14 px-10 bg-gold hover:bg-gold/90 text-void font-medium text-sm tracking-widest uppercase rounded-none"
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
          backgroundColor: '#050505',
          color: '#e5e5e5',
          fontFamily: "'Manrope', sans-serif",
          cursor: 'none'
        }}
      >
        <style jsx global>{`
          .journey-page ::-webkit-scrollbar {
            width: 6px;
          }
          .journey-page ::-webkit-scrollbar-track {
            background: #0a0a0a;
          }
          .journey-page ::-webkit-scrollbar-thumb {
            background: #333;
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
            className="fixed top-20 right-4 z-50"
          >
            <Link href="/journeys/edit">
              <Button
                className="bg-ash/80 backdrop-blur-xl border border-white/10 text-silk hover:bg-ash hover:text-white rounded-none text-xs tracking-widest uppercase px-6"
              >
                <Pencil className="w-3 h-3 mr-2" />
                Edit
              </Button>
            </Link>
          </motion.div>
        )}

        <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-40 mix-blend-difference">
          <Link 
            href="/journeys" 
            className="text-xl tracking-widest hover-trigger"
            style={{ fontFamily: "'Italiana', serif" }}
          >
            JOURNEYS.
          </Link>
          <div className="hidden md:flex gap-8 text-xs tracking-[0.2em] font-light">
            <a href="#seasons" className="hover:text-mist transition-colors hover-trigger">SEASONS</a>
          </div>
        </nav>

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
                <div className="w-20 h-20 mx-auto mb-8 rounded-full border border-white/10 flex items-center justify-center">
                  <Music className="w-8 h-8 text-mist" />
                </div>
                <h2 
                  className="text-3xl text-silk mb-4"
                  style={{ fontFamily: "'Italiana', serif" }}
                >
                  Your Journey Awaits
                </h2>
                <p className="text-mist mb-8 max-w-md mx-auto font-light">
                  Start by creating your first season to showcase your musical testimony.
                </p>
                <Link href="/journeys/edit">
                  <Button 
                    size="lg"
                    className="h-12 px-8 bg-gold hover:bg-gold/90 text-void rounded-none text-xs tracking-widest uppercase"
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
                <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-white/10 flex items-center justify-center">
                  <Music className="w-6 h-6 text-mist" />
                </div>
                <h2 
                  className="text-2xl text-silk mb-4"
                  style={{ fontFamily: "'Italiana', serif" }}
                >
                  No Seasons Yet
                </h2>
                <p className="text-mist font-light">
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
