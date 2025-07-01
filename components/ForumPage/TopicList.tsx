import React from 'react';
import type { FC } from 'react';
import Link from 'next/link';
import { Topic } from '@/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { categoryIcons, CategoryIconName } from '@/lib/categoryIcons';
import { VoteButtons } from './VoteButtons';
import { MessageSquare, User, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopicListProps {
  topics: Topic[];
}

export const TopicList: FC<TopicListProps> = ({ topics }) => {
  return (
    <div className="space-y-4">
      {topics.map((topic, index) => {
        const CategoryIcon = categoryIcons[topic.category as CategoryIconName] || categoryIcons['Uncategorized'];
        
        return (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative bg-card hover:bg-accent/5 rounded-2xl border border-border/40 hover:border-border transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {/* Vote Section - Mobile Optimized */}
                <div className="flex-shrink-0 order-2 sm:order-1">
                  <VoteButtons
                    itemId={topic.id}
                    itemType="topic"
                    initialUpvotes={topic.upvotes || 0}
                    initialDownvotes={topic.downvotes || 0}
                    initialUserVote={topic.userVote}
                  />
                </div>
                
                {/* Main Content - Mobile Optimized */}
                <div className="flex-1 min-w-0 order-1 sm:order-2 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                    <div className="flex-1">
                      <Link 
                        href={`/Forum/topics/${topic.id}`} 
                        className="group/link flex flex-col sm:inline-flex sm:flex-row items-start gap-2 sm:gap-3 text-foreground hover:text-primary transition-colors"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover/link:from-primary/30 group-hover/link:to-primary/20 transition-all duration-300">
                            <CategoryIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-base sm:text-lg font-semibold line-clamp-2 group-hover/link:text-primary transition-colors">
                              {topic.title}
                            </h2>
                            {topic.preview && (
                              <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {topic.preview}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 sm:opacity-0 group-hover/link:opacity-100 transition-all duration-300 transform group-hover/link:translate-x-1 flex-shrink-0 mt-1 hidden sm:block" />
                        </div>
                      </Link>
                    </div>
                    
                    {topic.category && (
                      (() => {
                        const badgeProps: BadgeProps = {
                          variant: 'secondary',
                          className: 'flex-shrink-0 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs sm:text-sm self-start',
                        };
                        return (
                          <Badge {...badgeProps}>{topic.category}</Badge>
                        );
                      })()
                    )}
                  </div>
                  
                  {/* Meta Information - Mobile Optimized */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="font-medium truncate max-w-[100px] sm:max-w-none">{topic.username}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <time dateTime={topic.created_at}>
                        {new Date(topic.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: new Date(topic.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </time>
                    </div>
                    {(topic.replies_count !== undefined && topic.replies_count > 0) && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{topic.replies_count} {topic.replies_count === 1 ? 'reply' : 'replies'}</span>
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
