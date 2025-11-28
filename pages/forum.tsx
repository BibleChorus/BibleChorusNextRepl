import React, { useEffect, useState } from 'react';
import { TopicList } from '@/components/ForumPage/TopicList';
import { NewTopicDialog } from '@/components/ForumPage/NewTopicDialog';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Head from 'next/head';
import { Topic, ForumCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Clock, Search, Filter, Plus, Sparkles, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Forum() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Topic[]>('/api/forum/topics');
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get<ForumCategory[]>('/api/forum/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchTopics();
    fetchCategories();
  }, []);

  const filteredTopics = topics
    .filter((topic) =>
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'all' || topic.category === selectedCategory)
    )
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.score || 0) - (a.score || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const stats = {
    totalTopics: topics.length,
    totalDiscussions: topics.reduce((acc, topic) => acc + (topic.replies_count || 0), 0),
    activeUsers: new Set(topics.map(t => t.username)).size
  };

  return (
    <>
      <Head>
        <title>BibleChorus - Community Forum</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/[0.08] via-purple-400/[0.06] to-pink-400/[0.08] dark:from-indigo-400/[0.13] dark:via-purple-400/[0.1] dark:to-pink-400/[0.13]"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-indigo-400/14 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-purple-400/14 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-pink-400/14 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
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
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-400/12 via-purple-400/12 to-pink-400/12 dark:from-indigo-400/16 dark:via-purple-400/16 dark:to-pink-400/16 backdrop-blur-md border border-indigo-400/14 dark:border-indigo-400/18 shadow-lg">
                  <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-semibold">
                    Join the Conversation
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Community</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Forum
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
                Connect with fellow believers through meaningful discussions about 
                <span className="font-semibold text-slate-900 dark:text-white"> Bible-inspired music</span> and 
                <span className="font-semibold text-slate-900 dark:text-white"> spiritual insights</span>
              </motion.p>
            </div>

            {/* Enhanced Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-400/12">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 group-hover:opacity-35 transition-opacity duration-500"></div>
                <MessageSquare className="relative w-10 h-10 mx-auto mb-4 text-indigo-500 dark:text-indigo-300 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent mb-2">{stats.totalTopics}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Active Topics</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-400/12">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 group-hover:opacity-35 transition-opacity duration-500"></div>
                <TrendingUp className="relative w-10 h-10 mx-auto mb-4 text-purple-500 dark:text-purple-300 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent mb-2">{stats.totalDiscussions}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Total Discussions</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/12 dark:border-slate-700/40 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-400/12">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/6 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full opacity-20 group-hover:opacity-35 transition-opacity duration-500"></div>
                <Users2 className="relative w-10 h-10 mx-auto mb-4 text-pink-500 dark:text-pink-300 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent mb-2">{stats.activeUsers}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Active Contributors</div>
              </div>
            </motion.div>
            
            {/* Enhanced Floating Elements */}
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
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-12 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-3xl shadow-2xl p-8 md:p-10"
          >
            {/* Enhanced Action Bar */}
            <div className="flex flex-col lg:flex-row gap-6 mb-10">
              {/* Search and Filters */}
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <Input
                    placeholder="Search topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-700 transition-all duration-300 rounded-xl text-base"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px] h-12 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value: 'recent' | 'popular') => setSortBy(value)}>
                    <SelectTrigger className="w-[160px] h-12 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">
                        <Clock className="w-4 h-4 mr-2 inline" />
                        Recent
                      </SelectItem>
                      <SelectItem value="popular">
                        <TrendingUp className="w-4 h-4 mr-2 inline" />
                        Popular
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enhanced New Topic Button */}
              {user && (
                <NewTopicDialog onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])}>
                  <Button className="relative h-12 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group rounded-xl font-semibold">
                    <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <Plus className="relative w-5 h-5 mr-2" />
                    <span className="relative">New Topic</span>
                  </Button>
                </NewTopicDialog>
              )}
            </div>

            {/* Topics List */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[500px]">
                <div className="space-y-6 text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 mx-auto"></div>
                    <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-indigo-400/16 to-purple-400/16"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-lg">Loading discussions...</p>
                </div>
              </div>
            ) : filteredTopics.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <TopicList topics={filteredTopics} />
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <MessageSquare className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20"></div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">No topics found</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg max-w-md mx-auto">
                  {searchTerm || selectedCategory !== 'all' 
                    ? "Try adjusting your filters or search terms to find more discussions"
                    : "Be the first to start a meaningful conversation in our community!"}
                </p>
                {user && !searchTerm && selectedCategory === 'all' && (
                  <NewTopicDialog onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])}>
                    <Button variant="outline" className="h-12 px-6 border-2 hover:scale-105 transition-all duration-300 rounded-xl">
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Topic
                    </Button>
                  </NewTopicDialog>
                )}
              </div>
            )}

            {/* Enhanced Active Categories */}
            {categories.length > 0 && !searchTerm && selectedCategory === 'all' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 pt-10 border-t border-slate-200/60 dark:border-slate-700/60"
              >
                <h3 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Browse by Category</h3>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => {
                    const topicCount = topics.filter(t => t.category === category.name).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.name)}
                        className="inline-flex items-center rounded-xl border-2 border-slate-200/60 dark:border-slate-700/60 px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-white/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white hover:border-transparent hover:scale-105 cursor-pointer backdrop-blur-sm"
                      >
                        {category.name}
                        <span className="ml-2 text-xs opacity-70 bg-slate-200/60 dark:bg-slate-600/60 px-2 py-0.5 rounded-full">
                          {topicCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
