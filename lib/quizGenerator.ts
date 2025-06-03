import { remark } from 'remark';
import remarkMdx from 'remark-mdx';

// Types for quiz questions
export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | number; // Index for MC, string for others
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'content' | 'verse' | 'application' | 'doctrine';
}

export interface QuizConfig {
  totalQuestions: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  typeDistribution: {
    'multiple-choice': number;
    'true-false': number;
    'fill-blank': number;
    'short-answer': number;
  };
}

// Default quiz configuration
const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  totalQuestions: 8,
  difficultyDistribution: {
    easy: 0.4, // 40%
    medium: 0.4, // 40%
    hard: 0.2, // 20%
  },
  typeDistribution: {
    'multiple-choice': 0.5, // 50%
    'true-false': 0.25, // 25%
    'fill-blank': 0.15, // 15%
    'short-answer': 0.1, // 10%
  },
};

// Common Bible books for questions
const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

/**
 * Extracts key concepts from MDX content
 */
function extractKeyConcepts(content: string): string[] {
  // Extract headings
  const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
  const concepts = headings.map(h => h.replace(/^#+\s+/, '').trim());
  
  // Extract emphasized text (bold/italic)
  const emphasized = content.match(/\*\*([^*]+)\*\*|\*([^*]+)\*/g) || [];
  concepts.push(...emphasized.map(e => e.replace(/\*+/g, '').trim()));
  
  // Extract key phrases (capitalized phrases)
  const keyPhrases = content.match(/\b[A-Z][A-Za-z\s]+(?=[.,:;])/g) || [];
  concepts.push(...keyPhrases);
  
  return [...new Set(concepts)].filter(c => c.length > 3 && c.length < 100);
}

/**
 * Extracts Bible verses from content
 */
function extractBibleVerses(content: string): string[] {
  const versePatterns = [
    /\b((?:\d\s+)?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)\b/g,
    /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs?|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+(\d+):(\d+(?:-\d+)?)\b/gi
  ];

  const verses = new Set<string>();
  
  versePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const book = match[1].trim();
      const chapter = match[2];
      const verse = match[3];
      verses.add(`${book} ${chapter}:${verse}`);
    }
  });

  return Array.from(verses);
}

/**
 * Generates multiple choice questions
 */
function generateMultipleChoiceQuestions(
  concepts: string[],
  verses: string[],
  content: string,
  count: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Content-based questions
  const conceptQuestions = concepts.slice(0, Math.ceil(count * 0.6)).map((concept, index) => {
    const correctValue = concept;
    const distractors = generateDistractors(concept, concepts);

    const options = shuffleArray([correctValue, ...distractors]).slice(0, 4);
    const correctAnswer = options.indexOf(correctValue);

    return {
      id: `mc-concept-${index}`,
      type: 'multiple-choice' as const,
      question: `What is a key concept discussed in this chapter related to habitual sin?`,
      options,
      correctAnswer,
      difficulty: 'medium' as const,
      category: 'content' as const,
    };
  });

  // Verse-based questions
  const verseQuestions = verses.slice(0, Math.floor(count * 0.4)).map((verse, index) => {
    const parts = verse.split(' ');
    const book = parts.slice(0, -1).join(' ');
    const reference = parts[parts.length - 1];
    
    const distractorBooks = BIBLE_BOOKS.filter(b => b !== book);
    const randomBooks = shuffleArray(distractorBooks).slice(0, 3);
    
    const options = shuffleArray([book, ...randomBooks]);
    const correctAnswer = options.indexOf(book);
    
    return {
      id: `mc-verse-${index}`,
      type: 'multiple-choice' as const,
      question: `Which book of the Bible contains the verse referenced as ${reference}?`,
      options,
      correctAnswer,
      difficulty: 'easy' as const,
      category: 'verse' as const,
    };
  });

  questions.push(...conceptQuestions, ...verseQuestions);
  
  return questions.slice(0, count);
}

/**
 * Generates true/false questions
 */
function generateTrueFalseQuestions(
  concepts: string[],
  verses: string[],
  content: string,
  count: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Generate statements about habitual sin
  const statements = [
    { text: "Habitual sin becomes easier to commit over time", answer: true, difficulty: 'easy' },
    { text: "All sins have the same spiritual consequences", answer: false, difficulty: 'medium' },
    { text: "Repentance is impossible for habitual sinners", answer: false, difficulty: 'hard' },
    { text: "God's grace is sufficient to overcome any habitual sin", answer: true, difficulty: 'medium' },
    { text: "Habitual sin only affects the individual committing it", answer: false, difficulty: 'easy' },
    { text: "Breaking free from habitual sin requires both divine help and human effort", answer: true, difficulty: 'medium' },
    { text: "Some habitual sins are too small to matter spiritually", answer: false, difficulty: 'medium' },
    { text: "Accountability partners can help overcome habitual sin", answer: true, difficulty: 'easy' },
  ];

  const selectedStatements = shuffleArray(statements).slice(0, count);
  
  return selectedStatements.map((statement, index) => ({
    id: `tf-${index}`,
    type: 'true-false' as const,
    question: statement.text,
    correctAnswer: statement.answer,
    difficulty: statement.difficulty as 'easy' | 'medium' | 'hard',
    category: 'doctrine' as const,
  }));
}

/**
 * Generates fill-in-the-blank questions
 */
function generateFillBlankQuestions(
  concepts: string[],
  verses: string[],
  content: string,
  count: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Extract sentences with key terms
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i].trim();
    const words = sentence.split(' ');
    
    // Find a good word to blank out (not too common, not too rare)
    const candidateWords = words.filter(word => 
      word.length > 4 && 
      !['the', 'and', 'but', 'that', 'this', 'with', 'from', 'they', 'have', 'will'].includes(word.toLowerCase())
    );
    
    if (candidateWords.length > 0) {
      const targetWord = candidateWords[Math.floor(Math.random() * candidateWords.length)];
      const blankedSentence = sentence.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '______');
      
      questions.push({
        id: `fb-${i}`,
        type: 'fill-blank' as const,
        question: `Fill in the blank: ${blankedSentence}`,
        correctAnswer: targetWord.toLowerCase(),
        difficulty: 'medium' as const,
        category: 'content' as const,
      });
    }
  }
  
  return questions.slice(0, count);
}

/**
 * Generates short answer questions
 */
function generateShortAnswerQuestions(
  concepts: string[],
  verses: string[],
  content: string,
  count: number
): QuizQuestion[] {
  const applicationQuestions = [
    "How can someone break free from a pattern of habitual sin?",
    "What role does accountability play in overcoming habitual sin?",
    "Why is it important to address small sins before they become habitual?",
    "How does God's grace help us overcome habitual sin?",
    "What practical steps can someone take to avoid falling into habitual sin?",
    "How does habitual sin affect our relationship with God?",
    "What is the difference between occasional sin and habitual sin?",
    "How can prayer help in overcoming habitual patterns of sin?",
  ];

  const selectedQuestions = shuffleArray(applicationQuestions).slice(0, count);
  
  return selectedQuestions.map((question, index) => ({
    id: `sa-${index}`,
    type: 'short-answer' as const,
    question,
    correctAnswer: "Sample answer", // Would need more sophisticated grading
    difficulty: 'hard' as const,
    category: 'application' as const,
  }));
}

/**
 * Generates distractors for multiple choice questions
 */
function generateDistractors(target: string, pool: string[]): string[] {
  const distractors = pool.filter(item => item !== target);
  return shuffleArray(distractors).slice(0, 3);
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Main function to generate a complete quiz from MDX content
 */
export async function generateQuiz(
  mdxContent: string,
  frontmatter: any,
  config: Partial<QuizConfig> = {}
): Promise<QuizQuestion[]> {
  const finalConfig = { ...DEFAULT_QUIZ_CONFIG, ...config };
  
  // Parse MDX content to extract text
  const processor = remark().use(remarkMdx);
  const tree = processor.parse(mdxContent);
  
  // Extract plain text content (simplified - would need proper MDX parsing)
  const textContent = mdxContent.replace(/^---[\s\S]*?---/, '') // Remove frontmatter
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // Convert links to text

  // Extract key information
  const concepts = extractKeyConcepts(textContent);
  const verses = frontmatter.keyVerses || extractBibleVerses(textContent);
  
  // Calculate question distribution
  const questionCounts = {
    'multiple-choice': Math.round(finalConfig.totalQuestions * finalConfig.typeDistribution['multiple-choice']),
    'true-false': Math.round(finalConfig.totalQuestions * finalConfig.typeDistribution['true-false']),
    'fill-blank': Math.round(finalConfig.totalQuestions * finalConfig.typeDistribution['fill-blank']),
    'short-answer': Math.round(finalConfig.totalQuestions * finalConfig.typeDistribution['short-answer']),
  };

  // Adjust to ensure total matches
  const totalCalculated = Object.values(questionCounts).reduce((sum, count) => sum + count, 0);
  if (totalCalculated !== finalConfig.totalQuestions) {
    questionCounts['multiple-choice'] += finalConfig.totalQuestions - totalCalculated;
  }

  // Generate questions by type
  const questions: QuizQuestion[] = [];
  
  if (questionCounts['multiple-choice'] > 0) {
    questions.push(...generateMultipleChoiceQuestions(concepts, verses, textContent, questionCounts['multiple-choice']));
  }
  
  if (questionCounts['true-false'] > 0) {
    questions.push(...generateTrueFalseQuestions(concepts, verses, textContent, questionCounts['true-false']));
  }
  
  if (questionCounts['fill-blank'] > 0) {
    questions.push(...generateFillBlankQuestions(concepts, verses, textContent, questionCounts['fill-blank']));
  }
  
  if (questionCounts['short-answer'] > 0) {
    questions.push(...generateShortAnswerQuestions(concepts, verses, textContent, questionCounts['short-answer']));
  }

  // Shuffle final questions
  return shuffleArray(questions);
}

/**
 * Calculates quiz score based on answers
 */
export function calculateQuizScore(questions: QuizQuestion[], answers: (string | number)[]): number {
  if (questions.length === 0) return 0;
  
  let correctCount = 0;
  
  questions.forEach((question, index) => {
    const userAnswer = answers[index];
    const correctAnswer = question.correctAnswer;
    
    if (question.type === 'multiple-choice') {
      if (userAnswer === correctAnswer) correctCount++;
    } else if (question.type === 'true-false') {
      if (Boolean(userAnswer) === Boolean(correctAnswer)) correctCount++;
    } else if (question.type === 'fill-blank') {
      const userText = String(userAnswer).toLowerCase().trim();
      const correctText = String(correctAnswer).toLowerCase().trim();
      if (userText === correctText || userText.includes(correctText)) correctCount++;
    } else if (question.type === 'short-answer') {
      // For short answers, we'd need more sophisticated grading
      // For now, give partial credit if answer is not empty
      if (String(userAnswer).trim().length > 10) correctCount += 0.5;
    }
  });
  
  return Math.round((correctCount / questions.length) * 100);
}

/**
 * Validates quiz answers format
 */
export function validateQuizAnswers(questions: QuizQuestion[], answers: any[]): boolean {
  if (questions.length !== answers.length) return false;
  
  return questions.every((question, index) => {
    const answer = answers[index];
    
    switch (question.type) {
      case 'multiple-choice':
        return typeof answer === 'number' && answer >= 0 && answer < (question.options?.length || 0);
      case 'true-false':
        return typeof answer === 'boolean';
      case 'fill-blank':
      case 'short-answer':
        return typeof answer === 'string' && answer.trim().length > 0;
      default:
        return false;
    }
  });
} 