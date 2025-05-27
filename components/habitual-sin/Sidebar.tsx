import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Brain,
  ChevronDown,
  ChevronRight,
  Target,
  Trophy,
  Bookmark,
  PenTool,
  X,
  Menu
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/hooks/useUser';

// Types for chapter data
interface Chapter {
  slug: string;
  title: string;
  order: number;
  estimatedReadTime?: number;
  description?: string;
}

interface SidebarProps {
  chapters: Chapter[];
  currentChapter?: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface ProgressStats {
  totalChapters: number;
  completedChapters: number;
  totalReadingTime: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  currentStreak: number;
}

export default function Sidebar({ 
  chapters, 
  currentChapter, 
  isOpen, 
  onToggle, 
  className = '' 
}: SidebarProps) {
  const router = useRouter();
  const { user } = useUser();
  const { getProgress, getAllProgress } = useProgress();
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['chapters', 'progress'])
  );

  // Get progress data for all chapters
  const allProgress = getAllProgress();
  
  // Calculate overall progress statistics
  const progressStats: ProgressStats = React.useMemo(() => {
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(ch => 
      allProgress[ch.slug]?.reading?.completed
    ).length;
    
    const totalReadingTime = Object.values(allProgress).reduce(
      (sum, progress) => sum + (progress.reading?.timeSpent || 0), 0
    );
    
    const quizProgresses = Object.values(allProgress).filter(p => p.quiz);
    const totalQuizzes = chapters.length; // Assuming each chapter has a quiz
    const completedQuizzes = quizProgresses.filter(p => p.quiz?.completed).length;
    
    const averageScore = quizProgresses.length > 0 
      ? quizProgresses.reduce((sum, p) => sum + (p.quiz?.score || 0), 0) / quizProgresses.length
      : 0;

    // Calculate current streak (consecutive days with activity)
    const currentStreak = calculateStreak(allProgress);

    return {
      totalChapters,
      completedChapters,
      totalReadingTime,
      totalQuizzes,
      completedQuizzes,
      averageScore,
      currentStreak,
    };
  }, [chapters, allProgress]);

  // Calculate reading streak
  function calculateStreak(progressData: any): number {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check each day going backwards
    while (streak < 365) { // Max 365 days to prevent infinite loop
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasActivity = Object.values(progressData).some((progress: any) => {
        const readingDate = progress.reading?.lastRead?.split('T')[0];
        const quizDate = progress.quiz?.completedAt?.split('T')[0];
        return readingDate === dateStr || quizDate === dateStr;
      });
      
      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Get chapter progress status
  const getChapterStatus = (chapterSlug: string) => {
    const progress = allProgress[chapterSlug];
    if (!progress) return 'not-started';
    
    if (progress.reading?.completed && progress.quiz?.completed) {
      return 'completed';
    } else if (progress.reading?.completed || progress.quiz?.completed) {
      return 'in-progress';
    } else if (progress.reading?.lastRead || progress.quiz?.attempts > 0) {
      return 'started';
    }
    
    return 'not-started';
  };

  // Get status icon for chapter
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'started':
        return <Circle className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Format time in minutes/hours
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Learning Progress
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Overall Progress Stats */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('progress')}
                  >
                    {expandedSections.has('progress') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('progress') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-4">
                      {/* Chapter Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Chapters</span>
                          <span className="font-medium">
                            {progressStats.completedChapters}/{progressStats.totalChapters}
                          </span>
                        </div>
                        <Progress 
                          value={(progressStats.completedChapters / progressStats.totalChapters) * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Quiz Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Quizzes</span>
                          <span className="font-medium">
                            {progressStats.completedQuizzes}/{progressStats.totalQuizzes}
                          </span>
                        </div>
                        <Progress 
                          value={(progressStats.completedQuizzes / progressStats.totalQuizzes) * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round(progressStats.averageScore)}%
                          </div>
                          <div className="text-xs text-gray-500">Avg Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {progressStats.currentStreak}
                          </div>
                          <div className="text-xs text-gray-500">Day Streak</div>
                        </div>
                        <div className="text-center col-span-2">
                          <div className="text-lg font-bold text-purple-600">
                            {formatTime(progressStats.totalReadingTime)}
                          </div>
                          <div className="text-xs text-gray-500">Total Reading Time</div>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Chapter Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Chapters</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('chapters')}
                >
                  {expandedSections.has('chapters') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.has('chapters') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-2">
                    {chapters.map((chapter) => {
                      const status = getChapterStatus(chapter.slug);
                      const isActive = currentChapter === chapter.slug;
                      const progress = allProgress[chapter.slug];
                      
                      return (
                        <div key={chapter.slug}>
                          <Link href={`/learn/habitual-sin/${chapter.slug}`}>
                            <div className={`
                              flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer
                              ${isActive 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                              }
                            `}>
                              <div className="flex-shrink-0">
                                {getStatusIcon(status)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {chapter.title}
                                </div>
                                {chapter.estimatedReadTime && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ~{chapter.estimatedReadTime} min read
                                  </div>
                                )}
                                {progress?.reading?.progressPercentage && (
                                  <div className="mt-1">
                                    <Progress 
                                      value={progress.reading.progressPercentage} 
                                      className="h-1"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Chapter actions */}
                              <div className="flex items-center gap-1">
                                {progress?.quiz?.completed && (
                                  <Badge variant="outline" className="text-xs">
                                    {progress.quiz.score}%
                                  </Badge>
                                )}
                                {status === 'completed' && (
                                  <Trophy className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </Link>
                          
                          {/* Chapter sub-actions */}
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="ml-7 mt-2 space-y-1"
                            >
                              <Link href={`/learn/habitual-sin/${chapter.slug}/quiz`}>
                                <div className="flex items-center gap-2 p-2 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                                  <Brain className="h-3 w-3" />
                                  Take Quiz
                                </div>
                              </Link>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Quick Actions */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push('/learn/habitual-sin')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    // TODO: Implement notes view
                    console.log('Open notes view');
                  }}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  My Notes
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    // TODO: Implement flashcards
                    console.log('Open flashcards');
                  }}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Flashcards
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-lg"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-700 lg:translate-x-0
          ${className}
        `}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
} 