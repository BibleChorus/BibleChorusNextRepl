import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PlaylistSection from '../components/PlaylistsPage/PlaylistSection';
import { fetchPlaylists } from '@/lib/api/playlists';
import { Playlist } from '../types';
import { BIBLE_BOOKS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, BookOpen, Heart, Users, Sparkles } from 'lucide-react';
import Head from 'next/head';
import { useTheme } from 'next-themes';

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

const FilmGrainOverlay: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.015]"
      style={{
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

interface AmbientOrbsOverlayProps {
  isDark: boolean;
}

const AmbientOrbsOverlay: React.FC<AmbientOrbsOverlayProps> = ({ isDark }) => {
  const orbColors = {
    primary: isDark ? 'rgba(212, 175, 55, 0.06)' : 'rgba(191, 161, 48, 0.05)',
    secondary: isDark ? 'rgba(160, 160, 160, 0.04)' : 'rgba(100, 100, 100, 0.03)',
    tertiary: isDark ? 'rgba(229, 229, 229, 0.02)' : 'rgba(50, 50, 50, 0.02)',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{
          background: orbColors.primary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: orbColors.secondary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full"
        style={{
          background: orbColors.tertiary,
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
    </div>
  );
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  };

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

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Playlists - BibleChorus</title>
          <meta name="description" content="Explore Bible-inspired music collections" />
        </Head>
        <div 
          className="min-h-screen opacity-0" 
          style={{ fontFamily: "'Manrope', sans-serif" }} 
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Playlists - BibleChorus</title>
        <meta name="description" content="Explore Bible-inspired music collections" />
      </Head>
      
      <div 
        className="min-h-screen relative"
        style={{ 
          backgroundColor: theme.bg,
          color: theme.text,
          fontFamily: "'Manrope', sans-serif"
        }}
      >
        <style jsx global>{`
          html, body {
            background-color: ${theme.bg} !important;
          }
          .playlist-tab[data-state="active"] {
            background-color: ${theme.accent} !important;
            color: ${isDark ? '#050505' : '#ffffff'} !important;
          }
        `}</style>

        <AmbientOrbsOverlay isDark={isDark} />
        <FilmGrainOverlay />

        <div className="relative" style={{ zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden pb-16 pt-24"
          >
            <div className="container mx-auto px-6 md:px-12">
              <div className="text-center max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="mb-8"
                >
                  <span 
                    className="inline-flex items-center gap-2.5 text-xs tracking-[0.5em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.accent }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Curated Collections
                  </span>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mb-8"
                >
                  <span 
                    className="block text-6xl md:text-7xl lg:text-8xl tracking-tight mb-2"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    Discover
                  </span>
                  <span 
                    className="block text-6xl md:text-7xl lg:text-8xl italic font-light"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text, opacity: 0.9 }}
                  >
                    Playlists
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
                  style={{ color: theme.textSecondary }}
                >
                  Explore curated collections of{' '}
                  <span style={{ color: theme.text, fontWeight: 500 }}>Bible-inspired music</span>, organized by{' '}
                  <span style={{ color: theme.text, fontWeight: 500 }}>testament and theme</span>
                </motion.p>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto px-6 md:px-12 pb-32">
            {loading ? (
              <div className="flex items-center justify-center min-h-[500px]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full"
                  style={{ 
                    border: `1px solid ${theme.border}`,
                    borderTopColor: theme.accent
                  }}
                />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Tabs defaultValue="auto" className="w-full">
                  <div 
                    className="mb-12 p-1"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.bgCard
                    }}
                  >
                    <TabsList 
                      className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto bg-transparent p-0"
                    >
                      {playlistGroups.map((group) => (
                        <TabsTrigger 
                          key={group.tabValue} 
                          value={group.tabValue}
                          className="playlist-tab relative h-12 px-2 sm:px-4 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300 rounded-none data-[state=active]:shadow-none"
                          style={{
                            color: theme.textSecondary,
                            backgroundColor: 'transparent',
                          }}
                        >
                          <group.icon className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden lg:inline">{group.title}</span>
                          <span className="lg:hidden text-[10px]">
                            {group.tabValue === 'old-testament' ? 'Old T.' : 
                             group.tabValue === 'new-testament' ? 'New T.' : 
                             group.title.split(' ')[0]}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  
                  {playlistGroups.map((group) => (
                    <TabsContent key={group.tabValue} value={group.tabValue} className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="mb-12 text-center">
                          <div className="flex items-center justify-center mb-6">
                            <div 
                              className="w-14 h-14 flex items-center justify-center"
                              style={{ border: `1px solid ${theme.border}` }}
                            >
                              <group.icon className="w-6 h-6" style={{ color: theme.accent }} />
                            </div>
                          </div>
                          <h2 
                            className="text-2xl md:text-3xl mb-3 tracking-wide"
                            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                          >
                            {group.title}
                          </h2>
                          <p 
                            className="text-sm font-light leading-relaxed max-w-xl mx-auto"
                            style={{ color: theme.textSecondary }}
                          >
                            {group.description}
                          </p>
                        </div>
                        
                        {group.playlists.length > 0 ? (
                          <PlaylistSection
                            title=""
                            playlists={group.playlists}
                            onPlaylistClick={handlePlaylistClick}
                          />
                        ) : (
                          <div 
                            className="text-center py-24"
                            style={{ border: `1px solid ${theme.border}` }}
                          >
                            <div 
                              className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
                              style={{ border: `1px solid ${theme.border}` }}
                            >
                              <group.icon className="w-6 h-6" style={{ color: theme.textSecondary }} />
                            </div>
                            <h3 
                              className="text-xl mb-3"
                              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                            >
                              No Playlists Available
                            </h3>
                            <p 
                              className="text-sm font-light"
                              style={{ color: theme.textSecondary }}
                            >
                              Check back soon for new collections in this category
                            </p>
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
      </div>
    </>
  );
}
