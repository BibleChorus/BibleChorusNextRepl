import { useState, useEffect, useRef, useCallback } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// UI Components
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Progress } from '../../../../components/ui/progress';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Textarea } from '../../../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

// Icons
import { 
  Book, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  BookOpen, 
  Award, 
  Target, 
  Users,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  NotebookPen,
  Brain,
  Heart,
  MessageSquare
} from 'lucide-react';

// Hooks and contexts
import { useProgress, useChapterProgress } from '../../../../hooks/useProgress';
import { useUser } from '../../../../hooks/useUser';
import { useIntersectionObserver } from '../../../../hooks/useIntersectionObserver';
import throttle from 'lodash.throttle';

// Components
import BibleVerse from '../../../../components/BibleVerse';

// Types
interface ChapterData {
  title: string;
  slug: string;
  order: number;
  chapterNumber: number | null;
  keyVerses: string[];
  estimatedReadingTime: number;
  audioUrl: string | null;
  content: MDXRemoteSerializeResult;
  nextChapter: { title: string; slug: string } | null;
  prevChapter: { title: string; slug: string } | null;
}

interface Props {
  chapterData: ChapterData;
}

// Custom MDX components for enhanced reading experience
const mdxComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 scroll-mt-20" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 mt-8 scroll-mt-20" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3 mt-6 scroll-mt-20" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-muted-foreground leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-6" {...props}>
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground" {...props}>
      {children}
    </ol>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-foreground" {...props}>
      {children}
    </em>
  ),
  BibleVerse: BibleVerse,
};

export default function ChapterPage({ chapterData }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const { saveNote } = useProgress();
  const chapterProgress = useChapterProgress(chapterData.slug);
  
  // Reading state
  const [isPlaying, setIsPlaying] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [reflectionNote, setReflectionNote] = useState('');
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const updateProgressThrottled = useCallback(
    throttle((progressValue: number, time: number) => {
      chapterProgress.updateProgress({
        scroll_progress_percent: Math.round(progressValue),
        reading_time_seconds: time,
      });
    }, 60000),
    [chapterProgress]
  );

  // Track reading time
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setReadingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = window.scrollY;
      const scrollHeight = element.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max((scrollTop / scrollHeight) * 100, 0), 100);
      
      setScrollProgress(progress);
      
      // Update progress in database (throttled)
      if (isAuthenticated && progress > chapterProgress.scrollProgress) {
        updateProgressThrottled(progress, readingTime);

        if (Math.round(progress) === 100) {
          updateProgressThrottled.flush();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      updateProgressThrottled.cancel();
    };
  }, [isAuthenticated, readingTime, chapterProgress, updateProgressThrottled]);

  // Start reading when component mounts
  useEffect(() => {
    if (isAuthenticated && !chapterProgress.isStarted) {
      chapterProgress.startReading();
    }
  }, [isAuthenticated, chapterProgress]);

  // Audio controls
  const toggleAudio = () => {
    if (!audioRef.current || !chapterData.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle reflection note submission
  const handleSaveReflection = async () => {
    if (!reflectionNote.trim() || !isAuthenticated) return;

    try {
      await saveNote(chapterData.slug, {
        note: reflectionNote,
        note_type: 'reflection',
        is_private: true,
      });
      
      setReflectionNote('');
      setIsReflectionOpen(false);
      // Could show a success toast here
    } catch (error) {
      console.error('Failed to save reflection:', error);
      // Could show an error toast here
    }
  };

  // Mark chapter as complete
  const handleCompleteChapter = () => {
    if (isAuthenticated) {
      chapterProgress.completeChapter();
    }
  };

  return (
    <>
      <Head>
        <title>{chapterData.title} - The Eternal Danger of Habitual Sin - BibleChorus</title>
        <meta 
          name="description" 
          content={`Read "${chapterData.title}" from The Eternal Danger of Habitual Sin. Interactive Bible study with progress tracking and reflection tools.`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/learn/habitual-sin">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Overview
                </Link>
              </Button>
              
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{chapterData.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Audio Control */}
              {chapterData.audioUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAudio}
                  className="hidden md:flex"
                >
                  {isPlaying ? (
                    <VolumeX className="h-4 w-4 mr-1" />
                  ) : (
                    <Volume2 className="h-4 w-4 mr-1" />
                  )}
                  {isPlaying ? 'Pause' : 'Listen'}
                </Button>
              )}

              {/* Progress Indicator */}
              <div className="flex items-center gap-2">
                <Progress value={scrollProgress} className="w-20 h-2" />
                <span className="text-xs text-muted-foreground min-w-[3rem]">
                  {Math.round(scrollProgress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Chapter Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Book className="h-4 w-4" />
              <span>The Eternal Danger of Habitual Sin</span>
              <span>•</span>
              <span>
                {chapterData.chapterNumber ? `Chapter ${chapterData.chapterNumber}` : chapterData.title}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {chapterData.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{chapterData.estimatedReadingTime} min read</span>
              </div>
              
              {chapterData.keyVerses.length > 0 && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{chapterData.keyVerses.length} key verses</span>
                </div>
              )}

              {isAuthenticated && chapterProgress.isCompleted && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>

            {/* Key Verses */}
            {chapterData.keyVerses.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Key Verses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {chapterData.keyVerses.map((verse, index) => (
                      <Badge key={index} variant="outline">
                        {verse}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Chapter Content */}
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-slate dark:prose-invert max-w-none mb-12"
          >
            <MDXRemote {...chapterData.content} components={mdxComponents} />
          </motion.div>

          {/* Chapter Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Reflection Section */}
            {isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NotebookPen className="h-5 w-5" />
                    Personal Reflection
                  </CardTitle>
                  <CardDescription>
                    Take a moment to reflect on what you've learned and how it applies to your life.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isReflectionOpen ? (
                    <Button onClick={() => setIsReflectionOpen(true)}>
                      <Heart className="h-4 w-4 mr-2" />
                      Add Reflection
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="What stood out to you in this chapter? How does it apply to your spiritual journey?"
                        value={reflectionNote}
                        onChange={(e) => setReflectionNote(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveReflection} disabled={!reflectionNote.trim()}>
                          Save Reflection
                        </Button>
                        <Button variant="outline" onClick={() => setIsReflectionOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Chapter Completion */}
            {isAuthenticated && !chapterProgress.isCompleted && scrollProgress > 80 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Ready to Complete This Chapter?</h3>
                  <p className="text-muted-foreground mb-4">
                    Mark this chapter as complete and continue your spiritual journey.
                  </p>
                  <Button onClick={handleCompleteChapter}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              {chapterData.prevChapter !== null ? (
                <Button asChild variant="outline">
                  <Link href={`/learn/habitual-sin/${chapterData.prevChapter.slug}`}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {chapterData.prevChapter.title}
                  </Link>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/learn/habitual-sin/${chapterData.slug}/quiz`}>
                    <Brain className="h-4 w-4 mr-2" />
                    Take Quiz
                  </Link>
                </Button>
              </div>

              {chapterData.nextChapter !== null ? (
                <Button asChild>
                  <Link href={`/learn/habitual-sin/${chapterData.nextChapter.slug}`}>
                    {chapterData.nextChapter.title}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/learn/habitual-sin">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Back to Overview
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Audio Element */}
      {chapterData.audioUrl && (
        <audio
          ref={audioRef}
          src={chapterData.audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </>
  );
}

// Static site generation
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const contentDir = path.join(process.cwd(), 'content', 'habitual-sin');
    
    if (!fs.existsSync(contentDir)) {
      return { paths: [], fallback: false };
    }

    const files = fs.readdirSync(contentDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    const paths = mdxFiles.map(file => ({
      params: { chapterSlug: file.replace('.mdx', '').replace(/^\d+[a-z]?-/, '') }
    }));

    return { paths, fallback: false };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const chapterSlug = params?.chapterSlug as string;
    const contentDir = path.join(process.cwd(), 'content', 'habitual-sin');
    
    // Find the MDX file that matches the slug
    const files = fs.readdirSync(contentDir);
    const mdxFile = files.find(file => 
      file.endsWith('.mdx') && file.includes(chapterSlug)
    );

    if (!mdxFile) {
      return { notFound: true };
    }

    // Read and parse the MDX file
    const filePath = path.join(contentDir, mdxFile);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);

    // Serialize MDX content
    const mdxSource = await serialize(content);

    // Load chapter metadata for navigation
    const indexPath = path.join(contentDir, 'index.json');
    let allChapters: any[] = [];
    
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const bookData = JSON.parse(indexContent);
      allChapters = bookData.chapters;
    }

    // Find current chapter and navigation
    const currentChapter = allChapters.find(ch => ch.slug === chapterSlug);
    const currentIndex = allChapters.findIndex(ch => ch.slug === chapterSlug);
    
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

    const chapterData: ChapterData = {
      title: frontmatter.title || 'Untitled Chapter',
      slug: frontmatter.slug || chapterSlug,
      order: frontmatter.order || 0,
      chapterNumber: frontmatter.chapterNumber || null,
      keyVerses: frontmatter.keyVerses || [],
      estimatedReadingTime: frontmatter.estimatedReadingTime || 5,
      audioUrl: frontmatter.audioUrl || null,
      content: mdxSource,
      prevChapter: prevChapter ? { title: prevChapter.title, slug: prevChapter.slug } : null,
      nextChapter: nextChapter ? { title: nextChapter.title, slug: nextChapter.slug } : null,
    };

    return {
      props: { chapterData },
      revalidate: 3600, // Regenerate every hour
    };
  } catch (error) {
    console.error('Error loading chapter:', error);
    return { notFound: true };
  }
}; 