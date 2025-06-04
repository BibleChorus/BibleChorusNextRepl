import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LearnPromoBannerProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'featured';
  showDismiss?: boolean;
  onDismiss?: () => void;
}

export default function LearnPromoBanner({ 
  className = '', 
  variant = 'default',
  showDismiss = false,
  onDismiss 
}: LearnPromoBannerProps) {
  
  if (variant === 'minimal') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Study Scripture
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Explore teachings with interactive lessons
              </p>
            </div>
          </div>
          <Link href="/learn">
            <Button size="sm" variant="outline">
              Start Learning
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 overflow-hidden relative">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Deepen Your Faith</h2>
                    <p className="text-blue-100 text-lg">
                      Study uploaded teachings at your own pace
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-sm text-blue-100">Chapters</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold">Interactive</div>
                    <div className="text-sm text-blue-100">Quizzes</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold">Progress</div>
                    <div className="text-sm text-blue-100">Tracking</div>
                  </div>
                </div>

                <Link href="/learn">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    Begin Study
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
              
              {/* Decorative elements */}
              <div className="hidden lg:block absolute right-8 top-8 opacity-10">
                <BookOpen className="h-32 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Strengthen Your Spiritual Foundation
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Dive deep into powerful Bible teachings with our interactive learning experience.
                  Track your progress, take quizzes, and reflect on key spiritual insights.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                    📖 Interactive Reading
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                    🧠 Auto-Generated Quizzes
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-sm rounded-full">
                    📝 Reflection Journal
                  </span>
                </div>
                <Link href="/learn">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Start Learning
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 