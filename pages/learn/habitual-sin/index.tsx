import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import fs from 'fs';
import path from 'path';

// UI Components
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { ScrollArea } from '../../../components/ui/scroll-area';

// Icons
import { Book, Clock, CheckCircle, PlayCircle, BookOpen, Award, Target, Users } from 'lucide-react';

// Hooks and contexts
import { useProgress } from '../../../hooks/useProgress';
import { useUser } from '../../../hooks/useUser';

// Types
interface ChapterMetadata {
  title: string;
  slug: string;
  order: number;
  chapterNumber: number | null;
  keyVerses: string[];
  estimatedReadingTime: number;
}

interface BookMetadata {
  title: string;
  chapters: ChapterMetadata[];
}

interface Props {
  bookData: BookMetadata;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function HabitualSinIndexPage({ bookData }: Props) {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useUser();
  const { getOverallProgress, getChapterProgress } = useProgress();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before using theme-dependent logic
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate progress statistics
  const overallProgress = getOverallProgress(bookData.chapters.length);
  const totalReadingTime = bookData.chapters.reduce((sum, chapter) => sum + chapter.estimatedReadingTime, 0);
  
  // Get chapter progress details
  const chaptersWithProgress = bookData.chapters.map(chapter => {
    const progress = getChapterProgress(chapter.slug);
    return {
      ...chapter,
      isStarted: !!progress,
      isCompleted: !!progress?.completed_at,
      quizScore: progress?.quiz_score || null,
      readingProgress: progress?.scroll_progress_percent || 0,
    };
  });

  const completedChapters = chaptersWithProgress.filter(c => c.isCompleted).length;
  const startedChapters = chaptersWithProgress.filter(c => c.isStarted).length;

  if (!mounted) {
    return <div className="min-h-screen bg-background" />; // Prevent hydration mismatch
  }

  return (
    <>
      <Head>
        <title>Learn: The Eternal Danger of Habitual Sin - BibleChorus</title>
        <meta 
          name="description" 
          content="Interactive study guide for 'The Eternal Danger of Habitual Sin'. Read, listen, reflect, and test your understanding with quizzes and progress tracking." 
        />
        <meta name="keywords" content="habitual sin, Bible study, spiritual growth, Christianity, interactive learning" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <motion.div
          className="container mx-auto px-4 py-8 max-w-6xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-full bg-primary/10 mr-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  The Eternal Danger of Habitual Sin
                </h1>
                <p className="text-xl text-muted-foreground">
                  An Interactive Study Guide for Spiritual Growth
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Book className="h-4 w-4" />
                <span>{bookData.chapters.length} Chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>~{totalReadingTime} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Interactive Quizzes</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Personal Reflection</span>
              </div>
            </div>
          </motion.div>

          {/* Progress Overview - Only for authenticated users */}
          {isAuthenticated && (
            <motion.div variants={itemVariants} className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Your Progress
                  </CardTitle>
                  <CardDescription>
                    Track your journey through this important study on habitual sin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Overall Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Completion</span>
                        <span>{Math.round(overallProgress.percentage)}%</span>
                      </div>
                      <Progress value={overallProgress.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {completedChapters} of {bookData.chapters.length} chapters completed
                      </p>
                    </div>

                    {/* Reading Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Chapters Started</span>
                        <Badge variant="secondary">{startedChapters}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Chapters Completed</span>
                        <Badge variant={completedChapters > 0 ? "default" : "secondary"}>
                          {completedChapters}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quizzes Taken</span>
                        <Badge variant="outline">
                          {chaptersWithProgress.filter(c => c.quizScore !== null).length}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      {overallProgress.percentage === 0 ? (
                        <Button asChild className="w-full">
                          <Link href={`/learn/habitual-sin/${bookData.chapters[0]?.slug}`}>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Reading
                          </Link>
                        </Button>
                      ) : overallProgress.percentage < 100 ? (
                        <Button asChild className="w-full">
                          <Link href={`/learn/habitual-sin/${chaptersWithProgress.find(c => !c.isCompleted)?.slug}`}>
                            Continue Reading
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/learn/habitual-sin/${bookData.chapters[0]?.slug}`}>
                            Review Content
                          </Link>
                        </Button>
                      )}
                      
                      <Button asChild variant="ghost" size="sm" className="w-full">
                        <Link href="#chapters">
                          View All Chapters
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Introduction */}
          <motion.div variants={itemVariants} className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>About This Study</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  "The Eternal Danger of Habitual Sin" is a profound exploration of how seemingly small, 
                  repeated sins can gradually harden our hearts and distance us from God. This interactive 
                  study guide will help you understand the serious spiritual implications of habitual sin 
                  and discover Biblical pathways to freedom and restoration.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">What You'll Learn</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• The progressive nature of habitual sin</li>
                      <li>• How sin affects our relationship with God</li>
                      <li>• Biblical strategies for overcoming sinful patterns</li>
                      <li>• The role of grace in spiritual transformation</li>
                      <li>• Practical steps for lasting change</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Study Features</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Interactive reading with progress tracking</li>
                      <li>• Chapter-based quizzes to test understanding</li>
                      <li>• Personal reflection journal</li>
                      <li>• Bible verse references and pop-overs</li>
                      <li>• Audio narration (where available)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chapter Navigation */}
          <motion.div variants={itemVariants} id="chapters">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-primary" />
                  Study Chapters
                </CardTitle>
                <CardDescription>
                  Each chapter builds upon the previous ones. We recommend reading in order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {chaptersWithProgress.map((chapter, index) => (
                      <motion.div
                        key={chapter.slug}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Link href={`/learn/habitual-sin/${chapter.slug}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex-shrink-0">
                                      {chapter.isCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : chapter.isStarted ? (
                                        <PlayCircle className="h-5 w-5 text-primary" />
                                      ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                                      )}
                                    </div>
                                    
                                    <div>
                                      <h3 className="font-semibold text-foreground">
                                        {chapter.chapterNumber ? `Chapter ${chapter.chapterNumber}: ` : ''}
                                        {chapter.title}
                                      </h3>
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {chapter.estimatedReadingTime} min
                                        </span>
                                        {chapter.keyVerses.length > 0 && (
                                          <span>{chapter.keyVerses.length} key verses</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Progress bar for started chapters */}
                                  {chapter.isStarted && (
                                    <div className="mt-2">
                                      <Progress 
                                        value={chapter.isCompleted ? 100 : chapter.readingProgress} 
                                        className="h-1" 
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Status badges */}
                                <div className="flex flex-col items-end gap-1 ml-4">
                                  {chapter.isCompleted && (
                                    <Badge variant="default" className="text-xs">
                                      Completed
                                    </Badge>
                                  )}
                                  {chapter.quizScore !== null && (
                                    <Badge variant="secondary" className="text-xs">
                                      Quiz: {chapter.quizScore}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call to Action for Unauthenticated Users */}
          {!isAuthenticated && (
            <motion.div variants={itemVariants} className="mt-8">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Ready to Begin Your Journey?</h3>
                  <p className="text-muted-foreground mb-4">
                    Create an account to track your progress, save notes, and take quizzes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                      <Link href="/login">
                        Sign In to Start
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/learn/habitual-sin/${bookData.chapters[0]?.slug}`}>
                        Read as Guest
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}

// Static site generation - loads chapter metadata at build time
export const getStaticProps: GetStaticProps = async () => {
  try {
    // Read the book metadata from the generated index.json
    const indexPath = path.join(process.cwd(), 'content', 'habitual-sin', 'index.json');
    
    let bookData: BookMetadata;
    
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      bookData = JSON.parse(indexContent);
    } else {
      // Fallback data if the conversion hasn't been run yet
      console.warn('Book metadata not found. Please run: npm run convert:habitual-sin');
      bookData = {
        title: "The Eternal Danger of Habitual Sin",
        chapters: [
          {
            title: "Preface",
            slug: "preface",
            order: 0,
            chapterNumber: null,
            keyVerses: [],
            estimatedReadingTime: 5,
          },
          // Add more fallback chapters as needed
        ]
      };
    }

    return {
      props: {
        bookData,
      },
      // Regenerate the page at most once per hour
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error loading book metadata:', error);
    
    // Return fallback data
    return {
      props: {
        bookData: {
          title: "The Eternal Danger of Habitual Sin",
          chapters: [],
        },
      },
      revalidate: 60,
    };
  }
}; 