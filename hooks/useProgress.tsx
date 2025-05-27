import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from './useUser'; // Assuming existing user hook

// Types for progress tracking
export interface ReadingProgress {
  id: number;
  user_id: number;
  chapter_slug: string;
  started_at: string;
  completed_at: string | null;
  reading_time_seconds: number;
  scroll_progress_percent: number;
  quiz_score: number | null;
  quiz_attempts: number;
  quiz_completed_at: string | null;
  quiz_answers: any[] | null;
  visit_count: number;
  last_visited_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserNote {
  id: number;
  user_id: number;
  chapter_slug: string;
  note: string;
  note_type: string;
  is_private: boolean;
  is_favorite: boolean;
  verse_reference: string | null;
  tags: string[] | null;
  sentiment: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterMetadata {
  title: string;
  slug: string;
  order: number;
  chapterNumber: number | null;
  keyVerses: string[];
  estimatedReadingTime: number;
}

interface ProgressContextType {
  // Progress state
  progress: Record<string, ReadingProgress>;
  notes: Record<string, UserNote[]>;
  isLoading: boolean;
  error: string | null;

  // Progress actions
  startReading: (chapterSlug: string) => Promise<void>;
  updateProgress: (chapterSlug: string, updates: Partial<ReadingProgress>) => Promise<void>;
  completeChapter: (chapterSlug: string) => Promise<void>;
  
  // Quiz actions
  submitQuiz: (chapterSlug: string, answers: any[], score: number) => Promise<void>;
  
  // Notes actions
  saveNote: (chapterSlug: string, note: Partial<UserNote>) => Promise<UserNote>;
  updateNote: (noteId: number, updates: Partial<UserNote>) => Promise<UserNote>;
  deleteNote: (noteId: number) => Promise<void>;
  
  // Utility functions
  getChapterProgress: (chapterSlug: string) => ReadingProgress | null;
  getChapterNotes: (chapterSlug: string) => UserNote[];
  getOverallProgress: () => { completed: number; total: number; percentage: number };
  
  // Data fetching
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

// Progress Provider Component
export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [notes, setNotes] = useState<Record<string, UserNote[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to make API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`/api/learn${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(errorData.message || `API call failed: ${response.status}`);
    }

    return response.json();
  };

  // Fetch initial progress data
  const refreshProgress = async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const [progressData, notesData] = await Promise.all([
        apiCall('/progress'),
        apiCall('/notes'),
      ]);

      // Convert arrays to objects keyed by chapter_slug
      const progressByChapter = progressData.reduce((acc: Record<string, ReadingProgress>, item: ReadingProgress) => {
        acc[item.chapter_slug] = item;
        return acc;
      }, {});

      const notesByChapter = notesData.reduce((acc: Record<string, UserNote[]>, item: UserNote) => {
        if (!acc[item.chapter_slug]) acc[item.chapter_slug] = [];
        acc[item.chapter_slug].push(item);
        return acc;
      }, {});

      setProgress(progressByChapter);
      setNotes(notesByChapter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
      console.error('Progress loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start reading a chapter
  const startReading = async (chapterSlug: string) => {
    if (!isAuthenticated) return;

    try {
      const result = await apiCall('/progress', {
        method: 'POST',
        body: JSON.stringify({
          chapter_slug: chapterSlug,
          action: 'start',
        }),
      });

      setProgress(prev => ({
        ...prev,
        [chapterSlug]: result,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start reading');
    }
  };

  // Update reading progress
  const updateProgress = async (chapterSlug: string, updates: Partial<ReadingProgress>) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setProgress(prev => ({
      ...prev,
      [chapterSlug]: {
        ...prev[chapterSlug],
        ...updates,
        updated_at: new Date().toISOString(),
      } as ReadingProgress,
    }));

    try {
      const result = await apiCall('/progress', {
        method: 'PUT',
        body: JSON.stringify({
          chapter_slug: chapterSlug,
          ...updates,
        }),
      });

      setProgress(prev => ({
        ...prev,
        [chapterSlug]: result,
      }));
    } catch (err) {
      // Revert optimistic update on error
      await refreshProgress();
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  };

  // Complete a chapter
  const completeChapter = async (chapterSlug: string) => {
    await updateProgress(chapterSlug, {
      completed_at: new Date().toISOString(),
      scroll_progress_percent: 100,
    });
  };

  // Submit quiz results
  const submitQuiz = async (chapterSlug: string, answers: any[], score: number) => {
    if (!isAuthenticated) return;

    try {
      const result = await apiCall('/progress', {
        method: 'PUT',
        body: JSON.stringify({
          chapter_slug: chapterSlug,
          quiz_score: score,
          quiz_answers: answers,
          quiz_completed_at: new Date().toISOString(),
          quiz_attempts: (progress[chapterSlug]?.quiz_attempts || 0) + 1,
        }),
      });

      setProgress(prev => ({
        ...prev,
        [chapterSlug]: result,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    }
  };

  // Save a note
  const saveNote = async (chapterSlug: string, note: Partial<UserNote>): Promise<UserNote> => {
    if (!isAuthenticated) throw new Error('Must be authenticated to save notes');

    try {
      const result = await apiCall('/notes', {
        method: 'POST',
        body: JSON.stringify({
          chapter_slug: chapterSlug,
          ...note,
          word_count: note.note ? note.note.split(/\s+/).length : 0,
        }),
      });

      setNotes(prev => ({
        ...prev,
        [chapterSlug]: [...(prev[chapterSlug] || []), result],
      }));

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
      throw err;
    }
  };

  // Update a note
  const updateNote = async (noteId: number, updates: Partial<UserNote>): Promise<UserNote> => {
    if (!isAuthenticated) throw new Error('Must be authenticated to update notes');

    try {
      const result = await apiCall(`/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...updates,
          word_count: updates.note ? updates.note.split(/\s+/).length : undefined,
        }),
      });

      setNotes(prev => {
        const newNotes = { ...prev };
        const chapterSlug = result.chapter_slug;
        if (newNotes[chapterSlug]) {
          const index = newNotes[chapterSlug].findIndex(n => n.id === noteId);
          if (index !== -1) {
            newNotes[chapterSlug][index] = result;
          }
        }
        return newNotes;
      });

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      throw err;
    }
  };

  // Delete a note
  const deleteNote = async (noteId: number) => {
    if (!isAuthenticated) return;

    try {
      await apiCall(`/notes/${noteId}`, { method: 'DELETE' });

      setNotes(prev => {
        const newNotes = { ...prev };
        Object.keys(newNotes).forEach(chapterSlug => {
          newNotes[chapterSlug] = newNotes[chapterSlug].filter(n => n.id !== noteId);
        });
        return newNotes;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  // Get progress for a specific chapter
  const getChapterProgress = (chapterSlug: string): ReadingProgress | null => {
    return progress[chapterSlug] || null;
  };

  // Get notes for a specific chapter
  const getChapterNotes = (chapterSlug: string): UserNote[] => {
    return notes[chapterSlug] || [];
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const allChapters = Object.keys(progress);
    const completedChapters = allChapters.filter(slug => progress[slug]?.completed_at);
    
    return {
      completed: completedChapters.length,
      total: allChapters.length,
      percentage: allChapters.length > 0 ? (completedChapters.length / allChapters.length) * 100 : 0,
    };
  };

  // Load progress on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshProgress();
    } else {
      // Clear data when user logs out
      setProgress({});
      setNotes({});
      setError(null);
    }
  }, [isAuthenticated, user?.id]);

  const contextValue: ProgressContextType = {
    progress,
    notes,
    isLoading,
    error,
    startReading,
    updateProgress,
    completeChapter,
    submitQuiz,
    saveNote,
    updateNote,
    deleteNote,
    getChapterProgress,
    getChapterNotes,
    getOverallProgress,
    refreshProgress,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
}

// Hook to use the progress context
export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}

// Hook for a specific chapter's progress
export function useChapterProgress(chapterSlug: string) {
  const { getChapterProgress, getChapterNotes, startReading, updateProgress, completeChapter } = useProgress();
  
  const progress = getChapterProgress(chapterSlug);
  const notes = getChapterNotes(chapterSlug);
  
  return {
    progress,
    notes,
    isStarted: !!progress,
    isCompleted: !!progress?.completed_at,
    quizScore: progress?.quiz_score,
    quizAttempts: progress?.quiz_attempts || 0,
    scrollProgress: progress?.scroll_progress_percent || 0,
    readingTime: progress?.reading_time_seconds || 0,
    visitCount: progress?.visit_count || 0,
    startReading: () => startReading(chapterSlug),
    updateProgress: (updates: Partial<ReadingProgress>) => updateProgress(chapterSlug, updates),
    completeChapter: () => completeChapter(chapterSlug),
  };
} 