import React, { useState, useEffect } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw,
  Trophy,
  BookOpen,
  Target
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/hooks/useUser';
import { generateQuiz, QuizQuestion, calculateQuizScore } from '@/lib/quizGenerator';

// Types for quiz state
interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: (string | number)[];
  timeStarted: Date;
  timeElapsed: number;
  isCompleted: boolean;
  score?: number;
  showResults: boolean;
}

interface ChapterData {
  slug: string;
  title: string;
  content: string;
  frontmatter: any;
}

interface QuizPageProps {
  chapter: ChapterData;
  allChapters: ChapterData[];
}

export default function QuizPage({ chapter, allChapters }: QuizPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const { updateQuizProgress, getProgress } = useProgress();
  
  // Quiz state management
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    timeStarted: new Date(),
    timeElapsed: 0,
    isCompleted: false,
    showResults: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer for tracking elapsed time
  useEffect(() => {
    if (!quizState.isCompleted && quizState.questions.length > 0) {
      const timer = setInterval(() => {
        setQuizState(prev => ({
          ...prev,
          timeElapsed: Math.floor((Date.now() - prev.timeStarted.getTime()) / 1000)
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizState.isCompleted, quizState.questions.length]);

  // Initialize quiz on component mount
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        setIsLoading(true);
        
        // Generate quiz questions from chapter content
        const questions = await generateQuiz(chapter.content, chapter.frontmatter);
        
        setQuizState(prev => ({
          ...prev,
          questions,
          answers: new Array(questions.length).fill(null),
          timeStarted: new Date(),
        }));
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing quiz:', err);
        setError('Failed to load quiz. Please try again.');
        setIsLoading(false);
      }
    };

    if (chapter) {
      initializeQuiz();
    }
  }, [chapter]);

  // Handle answer selection
  const handleAnswerSelect = (answer: string | number) => {
    setQuizState(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestionIndex] = answer;
      return {
        ...prev,
        answers: newAnswers,
      };
    });
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1),
    }));
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0),
    }));
  };

  // Submit quiz and calculate results
  const handleSubmitQuiz = async () => {
    try {
      const score = calculateQuizScore(quizState.questions, quizState.answers);
      const finalTimeElapsed = Math.floor((Date.now() - quizState.timeStarted.getTime()) / 1000);
      
      setQuizState(prev => ({
        ...prev,
        isCompleted: true,
        score,
        timeElapsed: finalTimeElapsed,
        showResults: true,
      }));

      // Update progress in database if user is logged in
      if (user) {
        await updateQuizProgress(chapter.slug, {
          completed: true,
          score,
          timeSpent: finalTimeElapsed,
          answers: quizState.answers,
          completedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    }
  };

  // Reset quiz to start over
  const handleResetQuiz = () => {
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: 0,
      answers: new Array(prev.questions.length).fill(null),
      timeStarted: new Date(),
      timeElapsed: 0,
      isCompleted: false,
      score: undefined,
      showResults: false,
    }));
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get score color based on percentage
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get score badge variant
  const getScoreBadge = (score: number): string => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    if (score >= 70) return 'outline';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Quiz</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                  <Button onClick={() => router.reload()}>Try Again</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;
  const answeredQuestions = quizState.answers.filter(a => a !== null).length;

  return (
    <>
      <Head>
        <title>{`Quiz: ${chapter.title} | BibleChorus Learn`}</title>
        <meta name="description" content={`Test your understanding of ${chapter.title} with this interactive quiz.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href={`/learn/habitual-sin/${chapter.slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chapter
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Chapter Quiz
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {chapter.title}
                </p>
              </div>
              
              {!quizState.showResults && (
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatTime(quizState.timeElapsed)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {answeredQuestions}/{quizState.questions.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quiz Content */}
          <AnimatePresence mode="wait">
            {!quizState.showResults ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                {/* Progress Bar */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(progress)}% Complete
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>

                {/* Question Card */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="mb-2">
                        {currentQuestion?.category}
                      </Badge>
                      <Badge variant={currentQuestion?.difficulty === 'easy' ? 'default' : 
                                   currentQuestion?.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                        {currentQuestion?.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl leading-relaxed">
                      {currentQuestion?.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Multiple Choice */}
                    {currentQuestion?.type === 'multiple-choice' && (
                      <RadioGroup
                        value={quizState.answers[quizState.currentQuestionIndex]?.toString() || ''}
                        onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                      >
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* True/False */}
                    {currentQuestion?.type === 'true-false' && (
                      <RadioGroup
                        value={quizState.answers[quizState.currentQuestionIndex]?.toString() || ''}
                        onValueChange={(value) => handleAnswerSelect(value === 'true')}
                      >
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          <RadioGroupItem value="true" id="true" />
                          <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          <RadioGroupItem value="false" id="false" />
                          <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {/* Fill in the Blank */}
                    {currentQuestion?.type === 'fill-blank' && (
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter your answer..."
                          value={quizState.answers[quizState.currentQuestionIndex]?.toString() || ''}
                          onChange={(e) => handleAnswerSelect(e.target.value)}
                          className="text-lg"
                        />
                      </div>
                    )}

                    {/* Short Answer */}
                    {currentQuestion?.type === 'short-answer' && (
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Enter your answer..."
                          value={quizState.answers[quizState.currentQuestionIndex]?.toString() || ''}
                          onChange={(e) => handleAnswerSelect(e.target.value)}
                          rows={4}
                          className="text-lg"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={quizState.currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {quizState.currentQuestionIndex === quizState.questions.length - 1 ? (
                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={answeredQuestions < quizState.questions.length}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Submit Quiz
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        disabled={quizState.currentQuestionIndex === quizState.questions.length - 1}
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Results Screen */
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
              >
                <Card className="text-center">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <Trophy className="h-16 w-16 text-yellow-500" />
                    </div>
                    <CardTitle className="text-3xl mb-2">Quiz Complete!</CardTitle>
                    <p className="text-gray-600 dark:text-gray-400">
                      Great job completing the quiz for {chapter.title}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Score Display */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(quizState.score || 0)}`}>
                          {quizState.score}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Final Score</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600">
                          {formatTime(quizState.timeElapsed)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Time Taken</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">
                          {Math.round((quizState.score || 0) / 100 * quizState.questions.length)}/{quizState.questions.length}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Performance Badge */}
                    <div className="flex justify-center">
                      <Badge variant={getScoreBadge(quizState.score || 0)} className="text-lg px-4 py-2">
                        {quizState.score && quizState.score >= 90 ? 'Excellent!' :
                         quizState.score && quizState.score >= 80 ? 'Great Job!' :
                         quizState.score && quizState.score >= 70 ? 'Good Work!' : 'Keep Studying!'}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        variant="outline"
                        onClick={handleResetQuiz}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake Quiz
                      </Button>
                      
                      <Link href={`/learn/habitual-sin/${chapter.slug}`}>
                        <Button variant="outline">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Review Chapter
                        </Button>
                      </Link>

                      <Link href="/learn/habitual-sin">
                        <Button>
                          Continue Learning
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Import the chapter index to get all available chapters
  const fs = require('fs');
  const path = require('path');
  
  try {
    const indexPath = path.join(process.cwd(), 'content/habitual-sin/index.json');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const chapters = JSON.parse(indexContent);
    
    const paths = chapters.map((chapter: any) => ({
      params: { chapterSlug: chapter.slug }
    }));

    return {
      paths,
      fallback: false
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: false
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const fs = require('fs');
  const path = require('path');
  const matter = require('gray-matter');
  
  try {
    const chapterSlug = params?.chapterSlug as string;
    
    // Load chapter index
    const indexPath = path.join(process.cwd(), 'content/habitual-sin/index.json');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const allChapters = JSON.parse(indexContent);
    
    // Find the specific chapter
    const chapterMeta = allChapters.find((ch: any) => ch.slug === chapterSlug);
    if (!chapterMeta) {
      return { notFound: true };
    }
    
    // Load chapter content
    const contentPath = path.join(process.cwd(), 'content/habitual-sin', chapterMeta.filename);
    const fileContent = fs.readFileSync(contentPath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);
    
    const chapter: ChapterData = {
      slug: chapterSlug,
      title: frontmatter.title || chapterMeta.title,
      content,
      frontmatter,
    };

    return {
      props: {
        chapter,
        allChapters,
      },
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}; 