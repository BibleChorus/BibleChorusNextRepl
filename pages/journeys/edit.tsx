import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    accentBgLight: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)',
  };
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 border-4"
              style={{ borderColor: theme.border, borderTopColor: theme.accent }}
            />
            <p style={{ color: theme.textSecondary }}>Loading your journey...</p>
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

      <div className="min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-12 pt-8"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.accentBgLight} 0%, transparent 50%, ${theme.accentBgLight} 100%)` }}></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <Link href="/journeys">
                  <Button variant="ghost" size="icon">
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
                    <span 
                      className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium backdrop-blur-md"
                      style={{ backgroundColor: theme.accentBgLight, border: `1px solid ${theme.accent}20` }}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: theme.accent }} />
                      <span style={{ color: theme.accent }}>Journey Editor</span>
                    </span>
                  </motion.div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
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
              <TabsList 
                className="backdrop-blur-xl p-1"
                style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
              >
                <TabsTrigger 
                  value="seasons" 
                  className="px-6"
                  style={{ 
                    backgroundColor: activeTab === 'seasons' ? theme.accent : 'transparent',
                    color: activeTab === 'seasons' ? '#ffffff' : theme.textSecondary
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Seasons
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="px-6"
                  style={{ 
                    backgroundColor: activeTab === 'settings' ? theme.accent : 'transparent',
                    color: activeTab === 'settings' ? '#ffffff' : theme.textSecondary
                  }}
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
