import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PlaylistSection from '../components/PlaylistsPage/PlaylistSection';
import { fetchPlaylists } from './api/playlists/api';
import { Playlist } from '../types';
import { BIBLE_BOOKS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, BookOpen, Heart, Users } from 'lucide-react';
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
            tabValue: 'old'
          },
          {
            title: 'New Testament Songs',
            playlists: newTestamentPlaylists,
            icon: Heart,
            description: 'Songs from Matthew to Revelation',
            tabValue: 'new'
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
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden pb-16 pt-8"
        >
          {/* Animated Mesh Gradient Background */}
          <div className="absolute inset-0">
            {/* Subtle hero gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-indigo-500/10 dark:from-violet-500/15 dark:via-fuchsia-500/15 dark:to-indigo-500/15"></div>
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-[0.15] animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-[0.15] animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-[0.15] animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-4"
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-violet-600/10 to-indigo-600/10 dark:from-violet-600/20 dark:to-indigo-600/20 backdrop-blur-sm border border-violet-600/20 dark:border-violet-600/30">
                  <Music className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Curated Collections
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
              >
                <span className="block text-foreground">Discover</span>
                <span className="block mt-2 relative">
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
                    Playlists
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 10" preserveAspectRatio="none">
                    <path d="M0,5 Q75,0 150,5 T300,5" stroke="url(#gradient)" strokeWidth="2" fill="none" className="animate-draw-line" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="50%" stopColor="#D946EF" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                Explore curated collections of Bible-inspired music, organized by testament and theme
              </motion.p>
              
              {/* Floating Elements */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-10 right-10 hidden lg:block"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-2xl backdrop-blur-sm animate-float"></div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="absolute bottom-10 left-10 hidden lg:block"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-xl backdrop-blur-sm animate-float animation-delay-2000"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading playlists...</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Tabs defaultValue="auto" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 p-1 bg-white/5 dark:bg-black/20 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-[2rem] shadow-xl">
                  {playlistGroups.map((group) => (
                    <TabsTrigger 
                      key={group.tabValue} 
                      value={group.tabValue}
                      className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 data-[state=active]:scale-[1.02]"
                    >
                      <group.icon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline font-medium">{group.title}</span>
                      <span className="sm:hidden font-medium">{group.title.split(' ')[0]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {playlistGroups.map((group, index) => (
                  <TabsContent key={group.tabValue} value={group.tabValue} className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="mb-8 text-center">
                        <h2 className="text-2xl font-semibold mb-2">{group.title}</h2>
                        <p className="text-muted-foreground">{group.description}</p>
                      </div>
                      
                      {group.playlists.length > 0 ? (
                        <PlaylistSection
                          title=""
                          playlists={group.playlists}
                          onPlaylistClick={handlePlaylistClick}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <group.icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">No playlists available yet</p>
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
