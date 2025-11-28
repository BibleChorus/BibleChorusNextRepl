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
      
      <div className="min-h-screen bg-gradient-to-br from-violet-50/40 via-white to-fuchsia-50/24 dark:from-violet-950/40 dark:via-slate-900 dark:to-fuchsia-950/24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/[0.08] via-fuchsia-400/[0.06] to-indigo-400/[0.08] dark:from-violet-400/[0.13] dark:via-fuchsia-400/[0.1] dark:to-indigo-400/[0.13]"></div>
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
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-violet-400/12 via-fuchsia-400/12 to-indigo-400/12 dark:from-violet-400/16 dark:via-fuchsia-400/16 dark:to-indigo-400/16 backdrop-blur-md border border-violet-400/14 dark:border-violet-400/18 shadow-lg">
                  <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-300" />
                  <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 dark:from-violet-300 dark:via-fuchsia-300 dark:to-indigo-300 bg-clip-text text-transparent font-semibold">
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
                  <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Playlists
                  </span>
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 rounded-full scale-x-0 animate-scale-x"></div>
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
              
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          {loading ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="space-y-6 text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-violet-500 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-violet-400/16 to-fuchsia-400/16"></div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-lg">Loading playlists...</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl shadow-2xl p-8 md:p-10"
            >
              <Tabs defaultValue="auto" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-16 p-1 bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-white/12 dark:border-slate-600/40 rounded-2xl shadow-xl gap-1 h-auto items-start">
                  {playlistGroups.map((group) => (
                    <TabsTrigger 
                      key={group.tabValue} 
                      value={group.tabValue}
                      className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-fuchsia-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 data-[state=active]:scale-[1.02] h-10 px-1 sm:px-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-600/40 text-xs sm:text-sm"
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
                          <div className="p-3 bg-gradient-to-br from-violet-400/12 to-fuchsia-400/12 rounded-2xl backdrop-blur-sm border border-violet-400/14 dark:border-violet-400/18">
                            <group.icon className="w-8 h-8 text-violet-500 dark:text-violet-300" />
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
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-full opacity-20"></div>
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
