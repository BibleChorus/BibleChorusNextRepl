import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Music, ArrowRight, Plus, BookOpen } from 'lucide-react';

export default function JourneysIndex() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Journeys | BibleChorus</title>
        <meta name="description" content="Discover musical journeys of faith through scripture songs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/[0.08] via-purple-400/[0.06] to-pink-400/[0.08] dark:from-indigo-400/[0.13] dark:via-purple-400/[0.1] dark:to-pink-400/[0.13]"></div>
            <motion.div 
              animate={{ 
                x: [0, 30, 0],
                y: [0, -50, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 -left-20 w-[500px] h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl"
            />
            <motion.div 
              animate={{ 
                x: [0, -20, 0],
                y: [0, 30, 0],
                scale: [1, 1.15, 1]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
              className="absolute top-20 -right-20 w-[400px] h-[400px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl"
            />
            <motion.div 
              animate={{ 
                x: [0, 40, 0],
                y: [0, 40, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 10 }}
              className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl"
            />
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-400/12 via-purple-400/12 to-pink-400/12 dark:from-indigo-400/16 dark:via-purple-400/16 dark:to-pink-400/16 backdrop-blur-md border border-indigo-400/14 dark:border-indigo-400/18 shadow-lg">
                  <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-semibold">
                    Musical Portfolios of Faith
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Discover</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Journeys
                  </span>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full origin-left"
                  />
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-12"
              >
                Explore musical portfolios that tell stories of faith through scripture songs. 
                Each journey is a testimony of God's faithfulness through seasons of life.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                {user ? (
                  <>
                    <Link href="/journeys/edit">
                      <Button 
                        size="lg"
                        className="h-14 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold text-lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Your Journey
                      </Button>
                    </Link>
                    <Link href={`/journeys/${user.username}`}>
                      <Button 
                        variant="outline"
                        size="lg"
                        className="h-14 px-8 rounded-xl font-semibold text-lg border-2"
                      >
                        View Your Journey
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/login">
                    <Button 
                      size="lg"
                      className="h-14 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold text-lg"
                    >
                      Sign In to Start
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="absolute top-16 right-16 hidden xl:block"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-400/16 to-purple-400/16 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute bottom-16 left-16 hidden xl:block"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400/16 to-pink-400/16 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
          </motion.div>
        </motion.div>

        <div className="container mx-auto px-4 -mt-8 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="relative text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Curate Your Songs
                </h3>
                <p className="relative text-slate-600 dark:text-slate-400">
                  Organize your scripture songs into meaningful seasons that tell your story.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="relative text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Share Your Story
                </h3>
                <p className="relative text-slate-600 dark:text-slate-400">
                  Add reflections, testimonies, and scripture references to each season.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="relative text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Inspire Others
                </h3>
                <p className="relative text-slate-600 dark:text-slate-400">
                  Let others walk through your journey and be encouraged by God's faithfulness.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
