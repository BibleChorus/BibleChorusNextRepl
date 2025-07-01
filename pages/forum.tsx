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
import { MessageSquare, TrendingUp, Clock, Search, Filter, Plus } from 'lucide-react';
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
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 dark:from-indigo-600/30 dark:via-purple-600/30 dark:to-pink-600/30"></div>
            <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-4"
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-indigo-600/20 dark:border-indigo-600/30">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Join the Discussion
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
              >
                <span className="block text-foreground">Community</span>
                <span className="block mt-2 relative">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                    Forum
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 10" preserveAspectRatio="none">
                    <path d="M0,5 Q75,0 150,5 T300,5" stroke="url(#gradient-forum)" strokeWidth="2" fill="none" className="animate-draw-line" />
                    <defs>
                      <linearGradient id="gradient-forum" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="50%" stopColor="#9333EA" />
                        <stop offset="100%" stopColor="#EC4899" />
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
                Join the conversation about Bible-inspired music, share insights, and connect with fellow believers
              </motion.p>
            </div>

            {/* Stats Cards - Improved Design */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
            >
              <div className="group relative bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-6 text-center hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <MessageSquare className="relative w-8 h-8 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
                <div className="relative text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">{stats.totalTopics}</div>
                <div className="relative text-sm text-muted-foreground mt-1">Active Topics</div>
              </div>
              <div className="group relative bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-6 text-center hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <TrendingUp className="relative w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <div className="relative text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{stats.totalDiscussions}</div>
                <div className="relative text-sm text-muted-foreground mt-1">Total Discussions</div>
              </div>
              <div className="group relative bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-6 text-center hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Clock className="relative w-8 h-8 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
                <div className="relative text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">{stats.activeUsers}</div>
                <div className="relative text-sm text-muted-foreground mt-1">Active Contributors</div>
              </div>
            </motion.div>
            
            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute top-10 right-10 hidden lg:block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm animate-float"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="absolute bottom-10 left-10 hidden lg:block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl backdrop-blur-sm animate-float animation-delay-2000"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl p-6 md:p-8"
          >
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              {/* Search and Filters */}
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Search topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 dark:bg-black/20 backdrop-blur-sm border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-black/30 focus:bg-white/10 dark:focus:bg-black/30 transition-all duration-300"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px] bg-white/5 dark:bg-black/20 backdrop-blur-sm border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300">
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
                    <SelectTrigger className="w-[140px] bg-white/5 dark:bg-black/20 backdrop-blur-sm border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300">
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

              {/* New Topic Button */}
              {user && (
                <NewTopicDialog onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])}>
                  <Button className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <Plus className="relative w-4 h-4 mr-2" />
                    <span className="relative">New Topic</span>
                  </Button>
                </NewTopicDialog>
              )}
            </div>

            {/* Topics List */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Loading discussions...</p>
                </div>
              </div>
            ) : filteredTopics.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <TopicList topics={filteredTopics} />
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No topics found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? "Try adjusting your filters or search terms"
                    : "Be the first to start a discussion!"}
                </p>
                {user && !searchTerm && selectedCategory === 'all' && (
                  <NewTopicDialog onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])}>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Topic
                    </Button>
                  </NewTopicDialog>
                )}
              </div>
            )}

            {/* Active Categories */}
            {categories.length > 0 && !searchTerm && selectedCategory === 'all' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-8 pt-8 border-t"
              >
                <h3 className="text-lg font-semibold mb-4">Browse by Category</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const topicCount = topics.filter(t => t.category === category.name).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.name)}
                        className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer"
                      >
                        {category.name}
                        <span className="ml-2 text-xs opacity-70">({topicCount})</span>
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
