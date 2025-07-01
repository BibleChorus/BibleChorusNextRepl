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
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-pink-600/10 dark:from-indigo-600/20 dark:via-purple-600/20 dark:to-pink-600/20 pb-16 pt-8"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                Community Forum
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto"
              >
                Join the conversation about Bible-inspired music, share insights, and connect with fellow believers
              </motion.p>
            </div>

            {/* Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
            >
              <div className="bg-background/60 backdrop-blur-sm border rounded-xl p-6 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                <div className="text-2xl font-bold">{stats.totalTopics}</div>
                <div className="text-sm text-muted-foreground">Active Topics</div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm border rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">{stats.totalDiscussions}</div>
                <div className="text-sm text-muted-foreground">Total Discussions</div>
              </div>
              <div className="bg-background/60 backdrop-blur-sm border rounded-xl p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Active Contributors</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-background/95 backdrop-blur-sm border rounded-2xl shadow-xl p-6 md:p-8"
          >
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              {/* Search and Filters */}
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px] bg-background/50">
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
                    <SelectTrigger className="w-[140px] bg-background/50">
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
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    New Topic
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
