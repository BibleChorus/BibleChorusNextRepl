import React from 'react';
import Link from 'next/link';
import { Topic } from '@/types';
import { Badge } from '@/components/ui/badge';
import { categoryIcons, CategoryIconName } from '@/lib/categoryIcons';
import { VoteButtons } from './VoteButtons';
import { MessageSquare, User, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopicListProps {
  topics: Topic[];
}

export const TopicList: React.FC<TopicListProps> = ({ topics }) => {
  return (
    <div className="space-y-6">
      {topics.map((topic, index) => {
        const CategoryIcon = categoryIcons[topic.category as CategoryIconName] || categoryIcons['Uncategorized'];
        
        return (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/80 dark:hover:border-slate-600/80 transition-all duration-500 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30 hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {/* Vote Section - Enhanced */}
                <div className="flex-shrink-0 order-2 sm:order-1">
                  <VoteButtons
                    itemId={topic.id}
                    itemType="topic"
                    initialUpvotes={topic.upvotes || 0}
                    initialDownvotes={topic.downvotes || 0}
                    initialUserVote={topic.userVote}
                  />
                </div>
                
                {/* Main Content - Enhanced */}
                <div className="flex-1 min-w-0 order-1 sm:order-2 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6 mb-4">
                    <div className="flex-1">
                      <Link 
                        href={`/Forum/topics/${topic.id}`} 
                        className="group/link flex flex-col sm:inline-flex sm:flex-row items-start gap-3 sm:gap-4 text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl group-hover/link:from-indigo-500/30 group-hover/link:via-purple-500/30 group-hover/link:to-pink-500/30 transition-all duration-300 border border-indigo-500/20 dark:border-indigo-400/20">
                            <CategoryIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-lg sm:text-xl font-bold line-clamp-2 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors duration-300 leading-tight">
                              {topic.title}
                            </h2>
                            {topic.content && (
                              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                {topic.content.substring(0, 150)}...
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500 opacity-0 sm:opacity-0 group-hover/link:opacity-100 transition-all duration-300 transform group-hover/link:translate-x-1 flex-shrink-0 mt-1 hidden sm:block" />
                        </div>
                      </Link>
                    </div>
                    
                    {topic.category && (
                      <Badge 
                        variant="secondary" 
                        className="flex-shrink-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 text-sm border-indigo-500/20 dark:border-indigo-400/20 self-start font-medium px-3 py-1.5 rounded-lg"
                      >
                        {topic.category}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Meta Information - Enhanced */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-base text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium truncate max-w-[120px] sm:max-w-none text-slate-700 dark:text-slate-300">{topic.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <time dateTime={topic.created_at} className="font-medium">
                        {new Date(topic.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: new Date(topic.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </time>
                    </div>
                    {topic.comments && topic.comments.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-700 dark:to-emerald-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                        </div>
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">
                          {topic.comments.length} {topic.comments.length === 1 ? 'reply' : 'replies'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
