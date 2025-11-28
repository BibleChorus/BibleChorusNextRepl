import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ModeToggle } from '../components/mode-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButtons } from '@/components/AuthButtons';
import { UserDropdown } from '@/components/UserDropdown';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, BookOpen, Upload, Map, MessageSquare, Users2, Sparkles, TrendingUp, Heart } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    totalListens: 0
  });

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

  const handleGetStarted = () => {
    router.push('/playlists');
  };

  const features = [
    { 
      title: 'Listen to Bible Songs', 
      description: 'Explore a growing collection of Bible-inspired music from our community.', 
      icon: Music, 
      link: '/listen',
      gradient: 'from-blue-500 to-indigo-500'
    },
    { 
      title: 'Upload Your Songs', 
      description: 'Share your own Bible-inspired compositions with believers worldwide.', 
      icon: Upload, 
      link: '/upload',
      gradient: 'from-emerald-500 to-teal-500'
    },
    { 
      title: 'Track Progress', 
      description: 'See which parts of the Bible have been set to music by our community.', 
      icon: Map, 
      link: '/progress',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      title: 'Join Discussions', 
      description: 'Engage with the community in meaningful conversations about faith and music.', 
      icon: MessageSquare, 
      link: '/forum',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'Bible Study Resources',
      description: 'Find PDFs for sermons, Christian books, and official Bible books with AI-powered study tools.',
      icon: BookOpen,
      link: '/pdfs',
      gradient: 'from-cyan-500 to-blue-500'
    },
  ];

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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        {/* Navigation Header */}
        <header className="relative z-50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border-b border-white/20 dark:border-slate-700/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="group">
                <div className="flex items-center transition-all duration-300 group-hover:scale-105">
                  <div className="relative">
                    <Image
                      src="/biblechorus-icon.png"
                      alt="BibleChorus Logo"
                      width={40}
                      height={40}
                      className="mr-3"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    BibleChorus
                  </span>
                </div>
              </Link>
              <div className="flex items-center space-x-4">
                {user ? (
                  <UserDropdown user={user} />
                ) : (
                  <AuthButtons />
                )}
                <ModeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.06] to-pink-500/[0.08] dark:from-indigo-500/[0.15] dark:via-purple-500/[0.12] dark:to-pink-500/[0.15]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-md border border-indigo-500/20 dark:border-indigo-500/30 shadow-lg">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-semibold">
                    Welcome to BibleChorus
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Explore Scripture</span>
                <span className="block relative">
                  <span className="block text-slate-900 dark:text-white mb-2">Through</span>
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Music
                  </span>
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full scale-x-0 animate-scale-x"></div>
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl text-slate-600 dark:text-slate-300 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
              >
                Discover, upload, and share 
                <span className="font-semibold text-slate-900 dark:text-white"> Bible-inspired songs</span> with our 
                <span className="font-semibold text-slate-900 dark:text-white"> growing community</span> of believers
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10"
              >
                <Button 
                  onClick={handleGetStarted} 
                  size="lg"
                  className="relative h-14 px-8 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group rounded-xl font-semibold text-lg"
                >
                  <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                  <Music className="relative w-5 h-5 mr-2" />
                  <span className="relative">Get Started</span>
                </Button>
              </motion.div>
            </div>

            {/* Enhanced Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <Music className="relative w-10 h-10 mx-auto mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-2">{stats.totalSongs.toLocaleString()}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Bible Songs</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <Users2 className="relative w-10 h-10 mx-auto mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">{stats.totalUsers.toLocaleString()}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Community Members</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <Heart className="relative w-10 h-10 mx-auto mb-4 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-2">{stats.totalListens.toLocaleString()}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Song Plays</div>
              </div>
            </motion.div>
            
            {/* Enhanced Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="absolute top-16 right-16 hidden xl:block"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="absolute bottom-16 left-16 hidden xl:block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-12 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-10"
          >
            {/* Features Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-16"
            >
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl backdrop-blur-sm border border-indigo-500/20 dark:border-indigo-500/30">
                    <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Discover What BibleChorus Offers
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                  Everything you need to explore, create, and share Bible-inspired music
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  >
                    <Link href={feature.link} className="group block h-full">
                      <Card className="h-full border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl rounded-2xl overflow-hidden group-hover:shadow-xl">
                        <CardHeader className="pb-4">
                          <div className="flex items-center mb-4">
                            <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              <feature.icon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                            {feature.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {feature.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Community CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="text-center bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm border border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl p-8 md:p-12"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl backdrop-blur-sm border border-indigo-500/30 dark:border-indigo-500/40">
                  <Users2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Join Our Growing Community
              </h2>
              <p className="text-xl mb-8 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Connect with fellow music lovers and Bible enthusiasts who are passionate about 
                setting Scripture to song and worshiping through music
              </p>
              {user ? (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="h-12 px-8 border-2 border-indigo-500/30 hover:border-indigo-500/50 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm hover:scale-105 transition-all duration-300 rounded-xl font-semibold"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Explore Now
                </Button>
              ) : (
                <Link href="/login?view=signup">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="h-12 px-8 border-2 border-indigo-500/30 hover:border-indigo-500/50 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm hover:scale-105 transition-all duration-300 rounded-xl font-semibold"
                  >
                    <Users2 className="w-5 h-5 mr-2" />
                    Sign Up Now
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced Footer */}
        <footer className="relative mt-20 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 dark:from-slate-950/90 dark:via-slate-900/90 dark:to-slate-950/90 backdrop-blur-xl border-t border-white/10 dark:border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <Image
                  src="/biblechorus-icon.png"
                  alt="BibleChorus Logo"
                  width={32}
                  height={32}
                  className="mr-3"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  BibleChorus
                </span>
              </div>
              <p className="text-slate-300 text-center md:text-right">
                &copy; 2024 BibleChorus. All rights reserved. Made with ❤️ for the body of Christ.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
