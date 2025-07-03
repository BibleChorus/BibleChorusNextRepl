import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PlaylistSection from '../components/PlaylistsPage/PlaylistSection';
import { fetchPlaylists } from './api/playlists/api';
import { Playlist } from '../types';
import { BIBLE_BOOKS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, BookOpen, Heart, Users, Sparkles, Library } from 'lucide-react';
import Head from 'next/head';

const oldTestamentOrder = ['Old Testament', ...BIBLE_BOOKS.slice(0, 39)];
const newTestamentOrder = ['New Testament', ...BIBLE_BOOKS.slice(39)];

const sortPlaylists = (playlists: Playlist[], order: string[]) => {
  return playlists.sort((a, b) => {
    const indexA = order.indexOf(a.name);
    const indexB = order.indexOf(b.name);
    if (indexA === -1 && indexB === -1) {
      return a.name.localeCompare(b.name);
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

export default function PlaylistsPage() {
  const [playlistGroups, setPlaylistGroups] = useState<{ 
    title: string; 
    playlists: Playlist[];
    icon: React.ElementType;
    description: string;
    tabValue: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getPlaylists = async () => {
      try {
        const data = await fetchPlaylists();

        const oldTestamentPlaylists = sortPlaylists(data.oldTestamentPlaylists, oldTestamentOrder);
        const newTestamentPlaylists = sortPlaylists(data.newTestamentPlaylists, newTestamentOrder);

        const groups = [
          {
            title: 'Auto Playlists',
            playlists: data.autoPlaylists,
            icon: Music,
            description: 'Curated collections updated automatically',
            tabValue: 'auto'
          },
          {
            title: 'Old Testament Songs',
            playlists: oldTestamentPlaylists,
            icon: BookOpen,
            description: 'Songs from Genesis to Malachi',
            tabValue: 'old-testament'
          },
          {
            title: 'New Testament Songs',
            playlists: newTestamentPlaylists,
            icon: Heart,
            description: 'Songs from Matthew to Revelation',
            tabValue: 'new-testament'
          },
          {
            title: 'User Playlists',
            playlists: data.userPlaylists,
            icon: Users,
            description: 'Community-created collections',
            tabValue: 'user'
          },
        ];

        setPlaylistGroups(groups);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setLoading(false);
      }
    };

    getPlaylists();
  }, []);

  const handlePlaylistClick = (playlistId: number) => {
    router.push(`/playlists/${playlistId}`);
  };

  return (
    <>
      <Head>
        <title>Playlists - BibleChorus</title>
        <meta name="description" content="Explore Bible-inspired music collections" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-fuchsia-50/30 dark:from-violet-950/50 dark:via-slate-900 dark:to-fuchsia-950/30">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.08] via-fuchsia-500/[0.06] to-indigo-500/[0.08] dark:from-violet-500/[0.15] dark:via-fuchsia-500/[0.12] dark:to-indigo-500/[0.15]"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-violet-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-fuchsia-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.1),rgba(255,255,255,0))]"></div>
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:via-fuchsia-500/20 dark:to-indigo-500/20 backdrop-blur-md border border-violet-500/20 dark:border-violet-500/30 shadow-lg">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-indigo-400 bg-clip-text text-transparent font-semibold">
                    Curated Collections
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Discover</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Playlists
                  </span>
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 rounded-full scale-x-0 animate-scale-x"></div>
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl text-slate-600 dark:text-slate-300 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
              >
                Explore curated collections of 
                <span className="font-semibold text-slate-900 dark:text-white"> Bible-inspired music</span>, organized by 
                <span className="font-semibold text-slate-900 dark:text-white"> testament and theme</span>
              </motion.p>
              
              {/* Enhanced Floating Elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-16 right-16 hidden xl:block"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="absolute bottom-16 left-16 hidden xl:block"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          {loading ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="space-y-6 text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-violet-600 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20"></div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-lg">Loading playlists...</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-10"
            >
              <Tabs defaultValue="auto" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-16 p-1 bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-white/20 dark:border-slate-600/50 rounded-2xl shadow-xl gap-1 h-auto items-start">
                  {playlistGroups.map((group) => (
                    <TabsTrigger 
                      key={group.tabValue} 
                      value={group.tabValue}
                      className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-fuchsia-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 data-[state=active]:scale-[1.02] h-10 px-1 sm:px-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-600/40 text-xs sm:text-sm"
                    >
                      <group.icon className="w-3 h-3 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden lg:inline">{group.title}</span>
                      <span className="lg:hidden text-xs leading-tight">
                        {group.tabValue === 'old-testament' ? 'Old Testament' : 
                         group.tabValue === 'new-testament' ? 'New Testament' : 
                         group.title.split(' ')[0]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {playlistGroups.map((group, index) => (
                  <TabsContent key={group.tabValue} value={group.tabValue} className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="mb-10 text-center">
                        <div className="flex items-center justify-center mb-4">
                          <div className="p-3 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-2xl backdrop-blur-sm border border-violet-500/20 dark:border-violet-500/30">
                            <group.icon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                          </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">{group.title}</h2>
                        <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">{group.description}</p>
                      </div>
                      
                      {group.playlists.length > 0 ? (
                        <PlaylistSection
                          title=""
                          playlists={group.playlists}
                          onPlaylistClick={handlePlaylistClick}
                        />
                      ) : (
                        <div className="text-center py-16">
                          <div className="relative mb-6">
                            <group.icon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full opacity-20"></div>
                          </div>
                          <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">No playlists available</h3>
                          <p className="text-slate-600 dark:text-slate-300 text-lg">Check back soon for new collections in this category</p>
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
