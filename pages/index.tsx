import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { AuthButtons } from '@/components/AuthButtons';
import { UserDropdown } from '@/components/UserDropdown';
import { ModeToggle } from '@/components/mode-toggle';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { 
  Music, BookOpen, Upload, Map, MessageSquare, Users, 
  Heart, Menu, Headphones, List, ArrowRight, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';

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

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { setIsMobileOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    totalListens: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#050505' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  };

  const features = [
    { 
      title: 'Listen', 
      description: 'Explore Bible-inspired music from our community of believers.', 
      icon: Headphones, 
      link: '/listen'
    },
    { 
      title: 'Upload', 
      description: 'Share your own scripture songs with the world.', 
      icon: Upload, 
      link: '/upload'
    },
    { 
      title: 'Journeys', 
      description: 'Create a musical portfolio of your faith story through seasons.', 
      icon: Map, 
      link: '/journeys'
    },
    { 
      title: 'Playlists', 
      description: 'Curate and share collections of your favorite songs.', 
      icon: List, 
      link: '/playlists'
    },
    { 
      title: 'Progress', 
      description: 'Track which parts of the Bible have been set to music.', 
      icon: Sparkles, 
      link: '/progress'
    },
    { 
      title: 'Forum', 
      description: 'Connect with others in meaningful discussions about faith.', 
      icon: MessageSquare, 
      link: '/forum'
    },
    { 
      title: 'Bible Study', 
      description: 'Access PDFs for sermons, books, and AI-powered study tools.', 
      icon: BookOpen, 
      link: '/pdfs'
    },
  ];

  if (!mounted) {
    return (
      <div style={{ backgroundColor: theme.bg, minHeight: '100vh' }} />
    );
  }

  return (
    <>
      <Head>
        <title>BibleChorus - Explore Scripture Through Music</title>
        <meta name="description" content="Discover, upload, and share Bible-inspired songs with BibleChorus. Join our community of believers setting Scripture to music." />
        <meta property="og:title" content="BibleChorus - Explore Scripture Through Music" />
        <meta property="og:description" content="Discover, upload, and share Bible-inspired songs with BibleChorus. Join our community of believers setting Scripture to music." />
        <meta property="og:image" content="/biblechorus-og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar />

      <div 
        className="min-h-screen relative"
        style={{ 
          backgroundColor: theme.bg,
          fontFamily: "'Manrope', sans-serif"
        }}
      >
        <FilmGrainOverlay />
        <AmbientOrbsOverlay isDark={isDark} />

        <header 
          className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
          style={{ 
            backgroundColor: `${theme.bg}e6`,
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${theme.borderLight}`
          }}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-lg transition-all duration-300 hover:scale-105"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  color: theme.text
                }}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <Image
                    src="/biblechorus-icon.png"
                    alt="BibleChorus"
                    width={36}
                    height={36}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span 
                  className="text-xl tracking-wide hidden sm:block"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  BibleChorus
                </span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <UserDropdown user={user} />
              ) : (
                <AuthButtons />
              )}
              <ModeToggle />
            </div>
          </div>
        </header>

        <main className="relative z-10 pt-24">
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="min-h-[70vh] flex items-center justify-center px-6"
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <span 
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase"
                  style={{ 
                    border: `1px solid ${theme.border}`,
                    color: theme.accent,
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  <Music className="w-3.5 h-3.5" />
                  Scripture Set to Song
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mb-8"
              >
                <span 
                  className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight mb-2"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  Explore Scripture
                </span>
                <span 
                  className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl italic font-light"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text, opacity: 0.9 }}
                >
                  Through Music
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-12"
                style={{ color: theme.textSecondary }}
              >
                Discover, upload, and share Bible-inspired songs with a growing community of believers.
                Every song is a testimony. Every melody carries the Word.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Button 
                  onClick={() => router.push('/listen')}
                  className="h-12 px-8 text-sm tracking-wider uppercase font-medium transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: theme.accent,
                    color: isDark ? '#000' : '#fff',
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  Start Listening
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/journeys')}
                  className="h-12 px-8 text-sm tracking-wider uppercase font-medium transition-all duration-300 hover:scale-105"
                  style={{ 
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: 'transparent',
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  <Map className="w-4 h-4 mr-2" />
                  Explore Journeys
                </Button>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="px-6 py-16"
          >
            <div className="max-w-5xl mx-auto">
              <div 
                className="grid md:grid-cols-3 gap-px"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="p-8 md:p-10 text-center transition-all duration-500"
                  style={{ borderRight: `1px solid ${theme.border}` }}
                >
                  <div 
                    className="w-14 h-14 mx-auto mb-6 flex items-center justify-center"
                    style={{ border: `1px solid ${theme.border}` }}
                  >
                    <Music className="w-6 h-6" style={{ color: theme.accent }} />
                  </div>
                  <div 
                    className="text-4xl md:text-5xl mb-3 tracking-tight"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    {stats.totalSongs.toLocaleString()}
                  </div>
                  <div 
                    className="text-xs tracking-[0.2em] uppercase"
                    style={{ color: theme.textSecondary }}
                  >
                    Bible Songs
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="p-8 md:p-10 text-center transition-all duration-500"
                  style={{ borderRight: `1px solid ${theme.border}` }}
                >
                  <div 
                    className="w-14 h-14 mx-auto mb-6 flex items-center justify-center"
                    style={{ border: `1px solid ${theme.border}` }}
                  >
                    <Users className="w-6 h-6" style={{ color: theme.accent }} />
                  </div>
                  <div 
                    className="text-4xl md:text-5xl mb-3 tracking-tight"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div 
                    className="text-xs tracking-[0.2em] uppercase"
                    style={{ color: theme.textSecondary }}
                  >
                    Community Members
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ backgroundColor: theme.hoverBg }}
                  className="p-8 md:p-10 text-center transition-all duration-500"
                >
                  <div 
                    className="w-14 h-14 mx-auto mb-6 flex items-center justify-center"
                    style={{ border: `1px solid ${theme.border}` }}
                  >
                    <Heart className="w-6 h-6" style={{ color: theme.accent }} />
                  </div>
                  <div 
                    className="text-4xl md:text-5xl mb-3 tracking-tight"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    {stats.totalListens.toLocaleString()}
                  </div>
                  <div 
                    className="text-xs tracking-[0.2em] uppercase"
                    style={{ color: theme.textSecondary }}
                  >
                    Song Plays
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>

          <section className="px-6 py-16">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex items-center gap-4 mb-12"
              >
                <Sparkles className="w-5 h-5" style={{ color: theme.accent }} />
                <h2 
                  className="text-xs tracking-[0.3em] uppercase"
                  style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                >
                  Discover What&apos;s Possible
                </h2>
              </motion.div>

              <div 
                className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.hoverBg
                }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.05 }}
                  >
                    <Link href={feature.link}>
                      <motion.div
                        whileHover={{ backgroundColor: theme.hoverBg }}
                        className="group p-6 md:p-8 transition-all duration-500 cursor-pointer h-full"
                        style={{ 
                          backgroundColor: theme.bgCard,
                          borderBottom: `1px solid ${theme.borderLight}`,
                          borderRight: `1px solid ${theme.borderLight}`
                        }}
                      >
                        <div 
                          className="w-12 h-12 mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                          style={{ border: `1px solid ${theme.border}` }}
                        >
                          <feature.icon 
                            className="w-5 h-5 transition-colors duration-300" 
                            style={{ color: theme.accent }} 
                          />
                        </div>
                        <h3 
                          className="text-lg mb-3 tracking-wide transition-colors duration-300"
                          style={{ 
                            fontFamily: "'Italiana', serif", 
                            color: theme.text 
                          }}
                        >
                          {feature.title}
                        </h3>
                        <p 
                          className="text-sm font-light leading-relaxed mb-4"
                          style={{ color: theme.textSecondary }}
                        >
                          {feature.description}
                        </p>
                        <div 
                          className="flex items-center gap-2 text-xs tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ color: theme.accent }}
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-6 py-24">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="text-center p-12 md:p-16"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <div 
                  className="w-16 h-16 mx-auto mb-8 flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Users className="w-7 h-7" style={{ color: theme.accent }} />
                </div>
                <h2 
                  className="text-3xl md:text-4xl mb-6 tracking-wide"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  Join Our Community
                </h2>
                <p 
                  className="text-base md:text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed"
                  style={{ color: theme.textSecondary }}
                >
                  Connect with fellow believers who are passionate about setting Scripture to song.
                  Share your music, discover new favorites, and grow together in faith.
                </p>
                {user ? (
                  <Button 
                    onClick={() => router.push('/listen')}
                    className="h-12 px-10 text-sm tracking-wider uppercase font-medium transition-all duration-300 hover:scale-105"
                    style={{ 
                      backgroundColor: theme.accent,
                      color: isDark ? '#000' : '#fff',
                      fontFamily: "'Manrope', sans-serif"
                    }}
                  >
                    Explore Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Link href="/login?view=signup">
                    <Button 
                      className="h-12 px-10 text-sm tracking-wider uppercase font-medium transition-all duration-300 hover:scale-105"
                      style={{ 
                        backgroundColor: theme.accent,
                        color: isDark ? '#000' : '#fff',
                        fontFamily: "'Manrope', sans-serif"
                      }}
                    >
                      Sign Up Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </section>

          <footer 
            className="px-6 py-12"
            style={{ borderTop: `1px solid ${theme.border}` }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <Image
                    src="/biblechorus-icon.png"
                    alt="BibleChorus"
                    width={28}
                    height={28}
                  />
                  <span 
                    className="text-lg"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    BibleChorus
                  </span>
                </div>
                <p 
                  className="text-sm font-light text-center"
                  style={{ color: theme.textSecondary }}
                >
                  &copy; {new Date().getFullYear()} BibleChorus. Made with love for the body of Christ.
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
