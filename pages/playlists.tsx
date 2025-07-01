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
      
      <div className="min-h-screen">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-teal-600/10 dark:from-purple-600/20 dark:via-blue-600/20 dark:to-teal-600/20 pb-16 pt-8"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              >
                Discover Playlists
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto"
              >
                Explore curated collections of Bible-inspired music, organized by testament and theme
              </motion.p>
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
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 bg-background/60 backdrop-blur-sm border">
                  {playlistGroups.map((group) => (
                    <TabsTrigger 
                      key={group.tabValue} 
                      value={group.tabValue}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                    >
                      <group.icon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{group.title}</span>
                      <span className="sm:hidden">{group.title.split(' ')[0]}</span>
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
