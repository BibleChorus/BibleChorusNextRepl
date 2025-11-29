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
import { useTheme } from 'next-themes';

export default function Forum() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [loading, setLoading] = useState(true);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    separator: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.2)',
    accentGlow: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(191, 161, 48, 0.1)',
  };

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

      <div 
        className="min-h-screen transition-colors duration-300"
        style={{ backgroundColor: theme.bg }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0"
              style={{
                background: isDark 
                  ? 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)'
                  : 'radial-gradient(ellipse at 50% 0%, rgba(191, 161, 48, 0.06) 0%, transparent 50%)'
              }}
            />
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 120%, rgba(212, 175, 55, 0.05), transparent 60%)'
              }}
            />
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span 
                  className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium backdrop-blur-md shadow-lg"
                  style={{
                    backgroundColor: theme.accentGlow,
                    border: `1px solid ${theme.borderHover}`,
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                  <span style={{ color: theme.accent, fontWeight: 600 }}>
                    Join the Conversation
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
                style={{ fontFamily: "'Italiana', serif" }}
              >
                <span className="block mb-2" style={{ color: theme.text }}>Community</span>
                <span className="block relative">
                  <span style={{ color: theme.accent }}>
                    Forum
                  </span>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 rounded-full origin-center"
                    style={{ backgroundColor: theme.accent }}
                  />
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed"
                style={{ 
                  color: theme.textSecondary,
                  fontFamily: "'Manrope', sans-serif"
                }}
              >
                Connect with fellow believers through meaningful discussions about 
                <span style={{ fontWeight: 600, color: theme.text }}> Bible-inspired music</span> and 
                <span style={{ fontWeight: 600, color: theme.text }}> spiritual insights</span>
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                className="group relative backdrop-blur-xl rounded-2xl p-8 text-center transition-all duration-500"
                style={{ 
                  backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: `1px solid ${theme.border}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.borderHover;
                  e.currentTarget.style.boxShadow = `0 20px 40px ${theme.accentGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div 
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                  style={{ backgroundColor: theme.accent }}
                />
                <MessageSquare 
                  className="relative w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" 
                  style={{ color: theme.accent }}
                />
                <div 
                  className="relative text-4xl font-bold mb-2"
                  style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                >
                  {stats.totalTopics}
                </div>
                <div 
                  className="relative text-sm font-medium"
                  style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                >
                  Active Topics
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                className="group relative backdrop-blur-xl rounded-2xl p-8 text-center transition-all duration-500"
                style={{ 
                  backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: `1px solid ${theme.border}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.borderHover;
                  e.currentTarget.style.boxShadow = `0 20px 40px ${theme.accentGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div 
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                  style={{ backgroundColor: theme.accent }}
                />
                <TrendingUp 
                  className="relative w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" 
                  style={{ color: theme.accent }}
                />
                <div 
                  className="relative text-4xl font-bold mb-2"
                  style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                >
                  {stats.totalDiscussions}
                </div>
                <div 
                  className="relative text-sm font-medium"
                  style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                >
                  Total Discussions
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                className="group relative backdrop-blur-xl rounded-2xl p-8 text-center transition-all duration-500"
                style={{ 
                  backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: `1px solid ${theme.border}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.borderHover;
                  e.currentTarget.style.boxShadow = `0 20px 40px ${theme.accentGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div 
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                  style={{ backgroundColor: theme.accent }}
                />
                <Users2 
                  className="relative w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" 
                  style={{ color: theme.accent }}
                />
                <div 
                  className="relative text-4xl font-bold mb-2"
                  style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                >
                  {stats.activeUsers}
                </div>
                <div 
                  className="relative text-sm font-medium"
                  style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                >
                  Active Contributors
                </div>
              </motion.div>
            </motion.div>
            
          </div>
        </motion.div>

        <div className="container mx-auto px-4 -mt-12 relative z-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="backdrop-blur-2xl rounded-2xl shadow-2xl p-8 md:p-10"
            style={{ 
              backgroundColor: isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${theme.border}`
            }}
          >
            <div className="flex flex-col lg:flex-row gap-6 mb-10">
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: theme.textSecondary }} />
                  <Input
                    placeholder="Search topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 backdrop-blur-sm transition-all duration-300 rounded-xl text-base"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: theme.border,
                      color: theme.text,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger 
                      className="w-[200px] h-12 backdrop-blur-sm transition-all duration-300 rounded-xl"
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: theme.border,
                        color: theme.text,
                        fontFamily: "'Manrope', sans-serif"
                      }}
                    >
                      <Filter className="w-4 h-4 mr-2" style={{ color: theme.accent }} />
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
                    <SelectTrigger 
                      className="w-[160px] h-12 backdrop-blur-sm transition-all duration-300 rounded-xl"
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: theme.border,
                        color: theme.text,
                        fontFamily: "'Manrope', sans-serif"
                      }}
                    >
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

              {user && (
                <NewTopicDialog onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])}>
                  <Button 
                    className="relative h-12 px-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group rounded-xl font-semibold"
                    style={{ 
                      backgroundColor: theme.accent,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.accentHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.accent;
                    }}
                  >
                    <span 
                      className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Plus className="relative w-5 h-5 mr-2" />
                    <span className="relative">New Topic</span>
                  </Button>
                </NewTopicDialog>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[500px]">
                <div className="space-y-6 text-center">
                  <div className="relative">
                    <div 
                      className="animate-spin rounded-full h-16 w-16 border-4 mx-auto"
                      style={{ 
                        borderColor: theme.border,
                        borderTopColor: theme.accent
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{ backgroundColor: theme.accentGlow }}
                    />
                  </div>
                  <p style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }} className="text-lg">
                    Loading discussions...
                  </p>
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
                  <MessageSquare className="w-16 h-16 mx-auto" style={{ color: theme.textSecondary }} />
                  <div 
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full opacity-20"
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>
                <h3 
                  className="text-2xl font-semibold mb-3"
                  style={{ color: theme.text, fontFamily: "'Italiana', serif" }}
                >
                  No topics found
                </h3>
                <p 
                  className="mb-6 text-lg max-w-md mx-auto"
                  style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                >
                  {searchTerm || selectedCategory !== 'all' 
                    ? "Try adjusting your filters or search terms to find more discussions"
                    : "Be the first to start a meaningful conversation in our community!"}
                </p>
                {user && !searchTerm && selectedCategory === 'all' && (
                  <NewTopicDialog onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])}>
                    <Button 
                      variant="outline" 
                      className="h-12 px-6 border-2 hover:scale-105 transition-all duration-300 rounded-xl"
                      style={{ 
                        borderColor: theme.accent,
                        color: theme.accent,
                        fontFamily: "'Manrope', sans-serif"
                      }}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Topic
                    </Button>
                  </NewTopicDialog>
                )}
              </div>
            )}

            {categories.length > 0 && !searchTerm && selectedCategory === 'all' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 pt-10"
                style={{ borderTop: `1px solid ${theme.border}` }}
              >
                <h3 
                  className="text-xl font-semibold mb-6"
                  style={{ color: theme.text, fontFamily: "'Italiana', serif" }}
                >
                  Browse by Category
                </h3>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => {
                    const topicCount = topics.filter(t => t.category === category.name).length;
                    return (
                      <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category.name)}
                        className="inline-flex items-center rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none backdrop-blur-sm cursor-pointer"
                        style={{ 
                          borderColor: theme.border,
                          color: theme.text,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                          fontFamily: "'Manrope', sans-serif"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = theme.accent;
                          e.currentTarget.style.backgroundColor = theme.accent;
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = theme.border;
                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                          e.currentTarget.style.color = theme.text;
                        }}
                      >
                        {category.name}
                        <span 
                          className="ml-2 text-xs opacity-70 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }}
                        >
                          {topicCount}
                        </span>
                      </motion.button>
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
