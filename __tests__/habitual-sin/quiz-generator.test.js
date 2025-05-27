const { generateQuiz, calculateQuizScore, validateQuizAnswers } = require('../../lib/quizGenerator');

// Mock MDX content for testing
const mockChapterContent = `
# The Progressive Nature of Sin

Sin is a **progressive disease** that affects the spiritual life. The Scriptures warn us in **Romans 6:23** that "the wages of sin is death." 

## Understanding Habitual Sin

**Habitual sin** refers to patterns of disobedience that become entrenched in our lives. As **James 1:15** tells us, "Then when lust hath conceived, it bringeth forth sin: and sin, when it is finished, bringeth forth death."

### The Danger of Small Compromises

What begins as seemingly small compromises can lead to **spiritual deadness**. Each act of disobedience makes the next one easier, creating a downward spiral.

### God's Grace and Restoration

Thankfully, **1 John 1:9** promises us that "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness."
`;

const mockFrontmatter = {
  title: "The Progressive Nature of Sin",
  description: "Understanding how sin progresses from small compromises to spiritual deadness",
  estimatedReadTime: 20,
  difficulty: "intermediate"
};

describe('Quiz Generator', () => {
  
  describe('generateQuiz', () => {
    test('should generate quiz questions from chapter content', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(10); // Default max questions
    });

    test('should generate questions with required properties', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      
      questions.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('type');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('correctAnswer');
        expect(question).toHaveProperty('difficulty');
        expect(question).toHaveProperty('category');
        
        expect(typeof question.id).toBe('string');
        expect(['multiple-choice', 'true-false', 'fill-blank', 'short-answer']).toContain(question.type);
        expect(typeof question.question).toBe('string');
        expect(['easy', 'medium', 'hard']).toContain(question.difficulty);
        expect(['content', 'verse', 'application', 'doctrine']).toContain(question.category);
      });
    });

    test('should generate multiple choice questions with options', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      const mcQuestions = questions.filter(q => q.type === 'multiple-choice');
      
      mcQuestions.forEach(question => {
        expect(question).toHaveProperty('options');
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options.length).toBeLessThanOrEqual(4);
        expect(typeof question.correctAnswer).toBe('number');
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(question.options.length);
      });
    });

    test('should generate true/false questions correctly', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      const tfQuestions = questions.filter(q => q.type === 'true-false');
      
      tfQuestions.forEach(question => {
        expect(typeof question.correctAnswer).toBe('boolean');
        expect(question.options).toBeUndefined(); // T/F doesn't need options array
      });
    });

    test('should respect custom quiz configuration', async () => {
      const customConfig = {
        totalQuestions: 5,
        difficultyDistribution: {
          easy: 0.6,
          medium: 0.4,
          hard: 0.0
        }
      };
      
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter, customConfig);
      
      expect(questions.length).toBeLessThanOrEqual(5);
      
      // Should not have any hard questions
      const hardQuestions = questions.filter(q => q.difficulty === 'hard');
      expect(hardQuestions.length).toBe(0);
    });

    test('should extract Bible verses for verse questions', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      const verseQuestions = questions.filter(q => q.category === 'verse');
      
      expect(verseQuestions.length).toBeGreaterThan(0);
      
      verseQuestions.forEach(question => {
        expect(question.question).toMatch(/Romans|James|John/i);
      });
    });
  });

  describe('calculateQuizScore', () => {
    const sampleQuestions = [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Test question 1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        difficulty: 'easy',
        category: 'content'
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Test question 2',
        correctAnswer: true,
        difficulty: 'medium',
        category: 'doctrine'
      },
      {
        id: 'q3',
        type: 'fill-blank',
        question: 'Test question 3',
        correctAnswer: 'answer',
        difficulty: 'hard',
        category: 'application'
      }
    ];

    test('should calculate correct score for all correct answers', () => {
      const answers = [1, true, 'answer'];
      const score = calculateQuizScore(sampleQuestions, answers);
      
      expect(score).toBe(100);
    });

    test('should calculate correct score for partial correct answers', () => {
      const answers = [1, false, 'wrong']; // 1 correct, 2 incorrect
      const score = calculateQuizScore(sampleQuestions, answers);
      
      expect(score).toBeCloseTo(33.33, 1);
    });

    test('should calculate correct score for all incorrect answers', () => {
      const answers = [0, false, 'wrong'];
      const score = calculateQuizScore(sampleQuestions, answers);
      
      expect(score).toBe(0);
    });

    test('should handle case-insensitive text answers', () => {
      const answers = [1, true, 'ANSWER']; // uppercase version of correct answer
      const score = calculateQuizScore(sampleQuestions, answers);
      
      expect(score).toBe(100);
    });

    test('should handle empty or null answers', () => {
      const answers = [null, undefined, ''];
      const score = calculateQuizScore(sampleQuestions, answers);
      
      expect(score).toBe(0);
    });
  });

  describe('validateQuizAnswers', () => {
    const sampleQuestions = [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Test question 1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        difficulty: 'easy',
        category: 'content'
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Test question 2',
        correctAnswer: true,
        difficulty: 'medium',
        category: 'doctrine'
      }
    ];

    test('should validate correct answer format for multiple choice', () => {
      const answers = [1, true];
      const isValid = validateQuizAnswers(sampleQuestions, answers);
      
      expect(isValid).toBe(true);
    });

    test('should validate correct answer format for true/false', () => {
      const answers = [0, false];
      const isValid = validateQuizAnswers(sampleQuestions, answers);
      
      expect(isValid).toBe(true);
    });

    test('should reject invalid multiple choice answers', () => {
      const answers = [5, true]; // 5 is out of range for options
      const isValid = validateQuizAnswers(sampleQuestions, answers);
      
      expect(isValid).toBe(false);
    });

    test('should reject wrong type answers', () => {
      const answers = ['string', 'not-boolean'];
      const isValid = validateQuizAnswers(sampleQuestions, answers);
      
      expect(isValid).toBe(false);
    });

    test('should reject insufficient answers', () => {
      const answers = [1]; // Missing answer for second question
      const isValid = validateQuizAnswers(sampleQuestions, answers);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content gracefully', async () => {
      const questions = await generateQuiz('', {});
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      // Should still generate some default questions even with empty content
    });

    test('should handle content with no Bible verses', async () => {
      const noVerseContent = `
        # Chapter Title
        
        This is some content about spiritual topics but doesn't contain 
        any specific Bible verse references in the standard format.
      `;
      
      const questions = await generateQuiz(noVerseContent, mockFrontmatter);
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      
      // Should still generate questions from other content
      const verseQuestions = questions.filter(q => q.category === 'verse');
      expect(verseQuestions.length).toBe(0);
    });

    test('should handle very short content', async () => {
      const shortContent = "Sin is bad.";
      
      const questions = await generateQuiz(shortContent, mockFrontmatter);
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
    });

    test('should limit questions when content is extensive', async () => {
      const extensiveContent = mockChapterContent.repeat(10); // Very long content
      
      const questions = await generateQuiz(extensiveContent, mockFrontmatter);
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeLessThanOrEqual(10); // Should respect max limit
    });
  });

  describe('Question Quality', () => {
    test('should generate questions with meaningful content', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      
      questions.forEach(question => {
        expect(question.question.length).toBeGreaterThan(10); // Meaningful length
        expect(question.question).not.toMatch(/^(test|sample|example)/i); // Not placeholder text
        
        if (question.type === 'multiple-choice') {
          question.options.forEach(option => {
            expect(option.length).toBeGreaterThan(0);
          });
        }
      });
    });

    test('should generate diverse question types', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      
      const questionTypes = new Set(questions.map(q => q.type));
      expect(questionTypes.size).toBeGreaterThan(1); // Should have multiple types
    });

    test('should generate diverse difficulty levels', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      
      const difficulties = new Set(questions.map(q => q.difficulty));
      expect(difficulties.size).toBeGreaterThanOrEqual(2); // Should have multiple difficulties
    });

    test('should generate diverse categories', async () => {
      const questions = await generateQuiz(mockChapterContent, mockFrontmatter);
      
      const categories = new Set(questions.map(q => q.category));
      expect(categories.size).toBeGreaterThan(1); // Should have multiple categories
    });
  });
}); 