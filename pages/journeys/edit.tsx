import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyProfile, Season } from '@/types/journey';
import { SeasonEditor } from '@/components/JourneysPage/SeasonEditor';
import { JourneySettings } from '@/components/JourneysPage/JourneySettings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ArrowLeft, Calendar } from 'lucide-react';
import { FaCog as Settings } from 'react-icons/fa';
import { FaEye as Eye } from 'react-icons/fa';
import { toast } from 'sonner';
import { LoginPromptDialog } from '@/components/LoginPromptDialog';

export default function EditJourneyPage() {
  const router = useRouter();
  const { user, getAuthToken } = useAuth();
  const [profile, setProfile] = useState<JourneyProfile | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('seasons');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setShowLoginPrompt(true);
        setIsLoading(false);
        return;
      }

      const [profileRes, seasonsRes] = await Promise.all([
        axios.get('/api/journeys/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/journeys/seasons', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProfile(profileRes.data);
      setSeasons(seasonsRes.data);
    } catch (error: any) {
      console.error('Error fetching journey data:', error);
      if (error.response?.status === 401) {
        setShowLoginPrompt(true);
      } else {
        toast.error('Failed to load your journey');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    if (!user) {
      setShowLoginPrompt(true);
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [user, fetchData]);

  const refreshSeasons = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get('/api/journeys/seasons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      for (const season of response.data) {
        const seasonDetail = await axios.get(`/api/journeys/seasons/${season.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        season.songs = seasonDetail.data.songs;
      }
      
      setSeasons(response.data);
    } catch (error) {
      console.error('Error refreshing seasons:', error);
    }
  }, [getAuthToken]);

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-background">
        <LoginPromptDialog
          isOpen={showLoginPrompt}
          onClose={() => router.push('/journeys')}
          title="Login Required"
          description="Please sign in to create and manage your journey."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Edit Journey | BibleChorus</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500"
            />
            <p className="text-slate-600 dark:text-slate-400">Loading your journey...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Journey | BibleChorus</title>
        <meta name="description" content="Edit your musical journey" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-12 pt-8"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/[0.08] via-purple-400/[0.06] to-pink-400/[0.08] dark:from-indigo-400/[0.13] dark:via-purple-400/[0.1] dark:to-pink-400/[0.13]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <Link href="/journeys">
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-1"
                  >
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-400/12 to-purple-400/12 backdrop-blur-md border border-indigo-400/14">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span className="text-indigo-600 dark:text-indigo-400">Journey Editor</span>
                    </span>
                  </motion.div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-slate-800 dark:text-slate-200"
                  >
                    {profile?.title || 'My Journey'}
                  </motion.h1>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {user && (
                  <Link href={`/journeys/${user.username}`}>
                    <Button 
                      variant="outline" 
                      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/40 p-1 rounded-xl">
                <TabsTrigger 
                  value="seasons" 
                  className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Seasons
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="seasons" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <SeasonEditor
                    seasons={seasons}
                    onSeasonsChange={setSeasons}
                    onRefresh={refreshSeasons}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {profile && (
                    <JourneySettings
                      profile={profile}
                      onProfileUpdate={setProfile}
                    />
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </>
  );
}
