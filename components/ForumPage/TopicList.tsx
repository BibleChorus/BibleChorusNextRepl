import React from 'react';
import Link from 'next/link';
import { Topic } from '@/types';
import { Badge } from '@/components/ui/badge';
import { categoryIcons, CategoryIconName } from '@/lib/categoryIcons';
import { VoteButtons } from './VoteButtons';
import { MessageSquare, User, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface TopicListProps {
  topics: Topic[];
}

export const TopicList: React.FC<TopicListProps> = ({ topics }) => {
  const { resolvedTheme } = useTheme();
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
            className="group relative backdrop-blur-xl rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.01]"
            style={{ 
              backgroundColor: isDark ? 'rgba(10, 10, 10, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              border: `1px solid ${theme.border}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.borderHover;
              e.currentTarget.style.boxShadow = `0 10px 30px ${theme.accentGlow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div 
              className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ backgroundColor: theme.accent }}
            />
            
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="flex-shrink-0 order-2 sm:order-1">
                  <VoteButtons
                    itemId={topic.id}
                    itemType="topic"
                    initialUpvotes={topic.upvotes || 0}
                    initialDownvotes={topic.downvotes || 0}
                    initialUserVote={topic.userVote}
                  />
                </div>
                
                <div className="flex-1 min-w-0 order-1 sm:order-2 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6 mb-4">
                    <div className="flex-1">
                      <Link 
                        href={`/Forum/topics/${topic.id}`} 
                        className="group/link flex flex-col sm:inline-flex sm:flex-row items-start gap-3 sm:gap-4 transition-colors duration-300"
                        style={{ color: theme.text }}
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div 
                            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
                            style={{ 
                              backgroundColor: theme.accentGlow,
                              border: `1px solid ${theme.borderHover}`
                            }}
                          >
                            <CategoryIcon className="h-6 w-6" style={{ color: theme.accent }} />
                          </div>
                          <div className="flex-1">
                            <h2 
                              className="text-lg sm:text-xl font-bold line-clamp-2 transition-colors duration-300 leading-tight group-hover/link:underline decoration-2 underline-offset-4"
                              style={{ 
                                color: theme.text,
                                fontFamily: "'Italiana', serif",
                                textDecorationColor: theme.accent
                              }}
                            >
                              {topic.title}
                            </h2>
                            {topic.preview && (
                              <p 
                                className="mt-2 text-sm sm:text-base line-clamp-2 leading-relaxed"
                                style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                              >
                                {topic.preview}
                              </p>
                            )}
                          </div>
                          <ArrowRight 
                            className="w-5 h-5 opacity-0 group-hover/link:opacity-100 transition-all duration-300 transform group-hover/link:translate-x-1 flex-shrink-0 mt-1 hidden sm:block" 
                            style={{ color: theme.accent }}
                          />
                        </div>
                      </Link>
                    </div>
                    
                    {topic.category && (
                      <Badge 
                        className="flex-shrink-0 transition-all duration-300 text-sm self-start font-medium px-3 py-1.5 rounded-lg"
                        style={{ 
                          backgroundColor: theme.accentGlow,
                          color: theme.accent,
                          border: `1px solid ${theme.borderHover}`,
                          fontFamily: "'Manrope', sans-serif"
                        }}
                      >
                        {topic.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div 
                    className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-base"
                    style={{ color: theme.textSecondary }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}` }}
                      >
                        <User className="w-4 h-4" style={{ color: theme.textSecondary }} />
                      </div>
                      <span 
                        className="font-medium truncate max-w-[120px] sm:max-w-none"
                        style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                      >
                        {topic.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}` }}
                      >
                        <Calendar className="w-4 h-4" style={{ color: theme.textSecondary }} />
                      </div>
                      <time 
                        dateTime={topic.created_at} 
                        className="font-medium"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        {new Date(topic.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: new Date(topic.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </time>
                    </div>
                    {(topic.replies_count !== undefined && topic.replies_count > 0) && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: theme.accentGlow, border: `1px solid ${theme.borderHover}` }}
                        >
                          <MessageSquare className="w-4 h-4" style={{ color: theme.accent }} />
                        </div>
                        <span 
                          className="font-medium"
                          style={{ color: theme.accent, fontFamily: "'Manrope', sans-serif" }}
                        >
                          {topic.replies_count} {topic.replies_count === 1 ? 'reply' : 'replies'}
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
