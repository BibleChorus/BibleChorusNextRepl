import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  BookOpen,
  Brain,
  CheckCircle,
  XCircle,
  Star,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/hooks/useUser';

// Types for flashcard data
interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: 'verse' | 'concept' | 'definition' | 'application';
  difficulty: 'easy' | 'medium' | 'hard';
  chapterSlug: string;
  tags: string[];
  lastReviewed?: Date;
  reviewCount: number;
  correctCount: number;
  nextReviewDate?: Date;
  easeFactor: number; // For spaced repetition algorithm
}

interface FlashcardSession {
  cards: Flashcard[];
  currentIndex: number;
  sessionStartTime: Date;
  reviewedCards: Set<string>;
  correctAnswers: Set<string>;
  incorrectAnswers: Set<string>;
  isComplete: boolean;
}

interface FlashcardsProps {
  chapterSlug?: string;
  allChapters?: any[];
  onClose?: () => void;
}

export default function Flashcards({ chapterSlug, allChapters, onClose }: FlashcardsProps) {
  const { user } = useUser();
  const { getProgress, updateFlashcardProgress } = useProgress();
  
  const [session, setSession] = useState<FlashcardSession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'verse' | 'concept' | 'definition' | 'application'>('all');

  // Generate flashcards from chapter content
  const generateFlashcards = (content: string, frontmatter: any, slug: string): Flashcard[] => {
    const cards: Flashcard[] = [];
    
    // Extract Bible verses for verse cards
    const versePattern = /\b((?:\d\s+)?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)\b/g;
    let match;
    while ((match = versePattern.exec(content)) !== null) {
      const book = match[1];
      const chapter = match[2];
      const verse = match[3];
      const reference = `${book} ${chapter}:${verse}`;
      
      cards.push({
        id: `verse-${slug}-${cards.length}`,
        front: `What is the reference for this verse context?`,
        back: reference,
        category: 'verse',
        difficulty: 'easy',
        chapterSlug: slug,
        tags: ['bible', 'verse', book.toLowerCase()],
        reviewCount: 0,
        correctCount: 0,
        easeFactor: 2.5,
      });
    }

    // Extract key concepts from headings
    const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
    headings.forEach((heading, index) => {
      const concept = heading.replace(/^#+\s+/, '').trim();
      if (concept.length > 5 && concept.length < 100) {
        cards.push({
          id: `concept-${slug}-${index}`,
          front: `What is the main concept: "${concept}"?`,
          back: `This concept relates to the progressive nature of habitual sin and its spiritual dangers.`,
          category: 'concept',
          difficulty: 'medium',
          chapterSlug: slug,
          tags: ['concept', 'main-idea'],
          reviewCount: 0,
          correctCount: 0,
          easeFactor: 2.5,
        });
      }
    });

    // Extract emphasized text for definitions
    const emphasized = content.match(/\*\*([^*]+)\*\*/g) || [];
    emphasized.forEach((text, index) => {
      const term = text.replace(/\*+/g, '').trim();
      if (term.length > 3 && term.length < 50) {
        cards.push({
          id: `definition-${slug}-${index}`,
          front: `Define: ${term}`,
          back: `${term} is a key term related to habitual sin and spiritual growth.`,
          category: 'definition',
          difficulty: 'medium',
          chapterSlug: slug,
          tags: ['definition', 'key-term'],
          reviewCount: 0,
          correctCount: 0,
          easeFactor: 2.5,
        });
      }
    });

    // Add application questions
    const applicationQuestions = [
      {
        front: "How can you apply this chapter's teachings to your daily life?",
        back: "Reflect on areas of habitual sin in your life and develop strategies for accountability and spiritual growth.",
        difficulty: 'hard' as const,
      },
      {
        front: "What practical steps can help break the cycle of habitual sin?",
        back: "Prayer, accountability, Scripture study, and relying on God's grace are essential steps.",
        difficulty: 'hard' as const,
      },
      {
        front: "Why is it important to address habitual sin early?",
        back: "Habitual sin becomes progressively harder to overcome and can lead to spiritual deadness.",
        difficulty: 'medium' as const,
      },
    ];

    applicationQuestions.forEach((q, index) => {
      cards.push({
        id: `application-${slug}-${index}`,
        front: q.front,
        back: q.back,
        category: 'application',
        difficulty: q.difficulty,
        chapterSlug: slug,
        tags: ['application', 'practical'],
        reviewCount: 0,
        correctCount: 0,
        easeFactor: 2.5,
      });
    });

    return cards;
  };

  // Initialize flashcard session
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      
      try {
        let allCards: Flashcard[] = [];
        
        if (chapterSlug) {
          // Generate cards for specific chapter
          // This would normally load from the chapter content
          // For now, we'll create sample cards
          allCards = generateSampleCards(chapterSlug);
        } else if (allChapters) {
          // Generate cards for all chapters
          allChapters.forEach(chapter => {
            const chapterCards = generateSampleCards(chapter.slug);
            allCards.push(...chapterCards);
          });
        }

        // Filter cards based on selected criteria
        const filteredCards = allCards.filter(card => {
          const difficultyMatch = selectedDifficulty === 'all' || card.difficulty === selectedDifficulty;
          const categoryMatch = selectedCategory === 'all' || card.category === selectedCategory;
          return difficultyMatch && categoryMatch;
        });

        // Shuffle cards
        const shuffledCards = [...filteredCards].sort(() => Math.random() - 0.5);

        setSession({
          cards: shuffledCards,
          currentIndex: 0,
          sessionStartTime: new Date(),
          reviewedCards: new Set(),
          correctAnswers: new Set(),
          incorrectAnswers: new Set(),
          isComplete: false,
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing flashcard session:', error);
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [chapterSlug, allChapters, selectedDifficulty, selectedCategory]);

  // Generate sample cards (this would normally use real content)
  const generateSampleCards = (slug: string): Flashcard[] => {
    return [
      {
        id: `sample-verse-${slug}-1`,
        front: "What does Romans 6:23 say about the wages of sin?",
        back: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.",
        category: 'verse',
        difficulty: 'easy',
        chapterSlug: slug,
        tags: ['romans', 'sin', 'death'],
        reviewCount: 0,
        correctCount: 0,
        easeFactor: 2.5,
      },
      {
        id: `sample-concept-${slug}-1`,
        front: "What is the progressive nature of habitual sin?",
        back: "Habitual sin becomes easier to commit over time, leading to spiritual deadness and separation from God.",
        category: 'concept',
        difficulty: 'medium',
        chapterSlug: slug,
        tags: ['progressive', 'habitual', 'sin'],
        reviewCount: 0,
        correctCount: 0,
        easeFactor: 2.5,
      },
      {
        id: `sample-definition-${slug}-1`,
        front: "Define 'habitual sin'",
        back: "Repeated sinful behavior that becomes a pattern or addiction, making it increasingly difficult to resist.",
        category: 'definition',
        difficulty: 'medium',
        chapterSlug: slug,
        tags: ['definition', 'habitual', 'sin'],
        reviewCount: 0,
        correctCount: 0,
        easeFactor: 2.5,
      },
      {
        id: `sample-application-${slug}-1`,
        front: "How can accountability help overcome habitual sin?",
        back: "Accountability provides support, encouragement, and gentle correction from fellow believers who can help identify patterns and provide prayer support.",
        category: 'application',
        difficulty: 'hard',
        chapterSlug: slug,
        tags: ['accountability', 'application', 'practical'],
        reviewCount: 0,
        correctCount: 0,
        easeFactor: 2.5,
      },
    ];
  };

  // Handle card flip
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Handle answer (correct/incorrect)
  const handleAnswer = async (isCorrect: boolean) => {
    if (!session || !session.cards[session.currentIndex]) return;

    const currentCard = session.cards[session.currentIndex];
    const cardId = currentCard.id;

    setSession(prev => {
      if (!prev) return prev;
      
      const newReviewedCards = new Set(prev.reviewedCards);
      newReviewedCards.add(cardId);
      
      const newCorrectAnswers = new Set(prev.correctAnswers);
      const newIncorrectAnswers = new Set(prev.incorrectAnswers);
      
      if (isCorrect) {
        newCorrectAnswers.add(cardId);
        newIncorrectAnswers.delete(cardId);
      } else {
        newIncorrectAnswers.add(cardId);
        newCorrectAnswers.delete(cardId);
      }

      return {
        ...prev,
        reviewedCards: newReviewedCards,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
      };
    });

    // Update card statistics
    if (user) {
      await updateFlashcardProgress(cardId, {
        reviewed: true,
        correct: isCorrect,
        reviewedAt: new Date().toISOString(),
      });
    }

    // Move to next card or complete session
    setTimeout(() => {
      if (session.currentIndex < session.cards.length - 1) {
        setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : prev);
        setIsFlipped(false);
      } else {
        setSession(prev => prev ? { ...prev, isComplete: true } : prev);
        setShowResults(true);
      }
    }, 500);
  };

  // Navigate to previous card
  const handlePrevious = () => {
    if (session && session.currentIndex > 0) {
      setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : prev);
      setIsFlipped(false);
    }
  };

  // Navigate to next card
  const handleNext = () => {
    if (session && session.currentIndex < session.cards.length - 1) {
      setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : prev);
      setIsFlipped(false);
    }
  };

  // Restart session
  const handleRestart = () => {
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        currentIndex: 0,
        sessionStartTime: new Date(),
        reviewedCards: new Set(),
        correctAnswers: new Set(),
        incorrectAnswers: new Set(),
        isComplete: false,
      } : prev);
      setShowResults(false);
      setIsFlipped(false);
    }
  };

  // Shuffle cards
  const handleShuffle = () => {
    if (session) {
      const shuffledCards = [...session.cards].sort(() => Math.random() - 0.5);
      setSession(prev => prev ? {
        ...prev,
        cards: shuffledCards,
        currentIndex: 0,
      } : prev);
      setIsFlipped(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!session || session.cards.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Flashcards Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No flashcards found for the selected criteria.
            </p>
            {onClose && (
              <Button onClick={onClose}>Close</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const accuracy = session.reviewedCards.size > 0 
      ? (session.correctAnswers.size / session.reviewedCards.size) * 100 
      : 0;
    const sessionTime = Math.floor((Date.now() - session.sessionStartTime.getTime()) / 1000);

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Star className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Great job reviewing your flashcards
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Results Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(accuracy)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {session.reviewedCards.size}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cards Reviewed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.floor(sessionTime / 60)}m {sessionTime % 60}s
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
            </div>
          </div>

          <Separator />

          {/* Performance Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold">Performance by Category</h4>
            {['verse', 'concept', 'definition', 'application'].map(category => {
              const categoryCards = session.cards.filter(card => card.category === category);
              const categoryCorrect = categoryCards.filter(card => 
                session.correctAnswers.has(card.id)
              ).length;
              const categoryTotal = categoryCards.filter(card => 
                session.reviewedCards.has(card.id)
              ).length;
              
              if (categoryTotal === 0) return null;
              
              const categoryAccuracy = (categoryCorrect / categoryTotal) * 100;
              
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="capitalize text-sm">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {categoryCorrect}/{categoryTotal}
                    </span>
                    <div className="w-20">
                      <Progress value={categoryAccuracy} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Study Again
            </Button>
            
            <Button onClick={handleShuffle} variant="outline">
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle & Restart
            </Button>
            
            {onClose && (
              <Button onClick={onClose}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentCard = session.cards[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Flashcards
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {chapterSlug ? 'Chapter Study' : 'All Chapters'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Card {session.currentIndex + 1} of {session.cards.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Flashcard */}
      <div className="relative h-80">
        <motion.div
          className="absolute inset-0 cursor-pointer"
          onClick={handleFlip}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isFlipped ? 'back' : 'front'}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Card className="h-full">
                <CardContent className="h-full flex flex-col justify-center p-8">
                  <div className="text-center space-y-4">
                    {/* Category Badge */}
                    <Badge variant="outline" className="mb-4">
                      {currentCard.category}
                    </Badge>
                    
                    {/* Card Content */}
                    <div className="text-lg leading-relaxed">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </div>
                    
                    {/* Flip Instruction */}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isFlipped ? 'Click to see question' : 'Click to reveal answer'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Answer Buttons */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-4"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleAnswer(false)}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <XCircle className="h-5 w-5 mr-2" />
            Incorrect
          </Button>
          
          <Button
            size="lg"
            onClick={() => handleAnswer(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Correct
          </Button>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={session.currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Target className="h-4 w-4" />
          {session.correctAnswers.size} correct, {session.incorrectAnswers.size} incorrect
        </div>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={session.currentIndex === session.cards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
} 