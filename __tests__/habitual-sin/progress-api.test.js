/**
 * @jest-environment node
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock the database module
const mockDb = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  del: jest.fn(),
  count: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
};

jest.mock('../../db.js', () => mockDb);

// Mock Next.js API handler
const progressHandler = require('../../pages/api/learn/progress');
const notesHandler = require('../../pages/api/learn/notes');

// Test data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com'
};

const mockReadingProgress = {
  id: 1,
  user_id: 1,
  chapter_slug: 'test-chapter',
  reading_started_at: new Date(),
  last_read_at: new Date(),
  progress_percentage: 75,
  time_spent_reading: 1200,
  reading_completed: false,
  quiz_completed: false,
  notes_count: 2,
  reflection_completed: true,
  last_activity_at: new Date(),
  created_at: new Date(),
  updated_at: new Date()
};

const mockUserNote = {
  id: 1,
  user_id: 1,
  chapter_slug: 'test-chapter',
  note_title: 'Test Reflection',
  note_content: 'This is a test reflection on the chapter content.',
  note_type: 'reflection',
  tags: JSON.stringify(['test', 'reflection']),
  is_private: true,
  sentiment: 'positive',
  created_at: new Date(),
  updated_at: new Date()
};

// Helper function to create mock request/response
function createMockReqRes(method = 'GET', body = {}, query = {}, headers = {}) {
  const mockReq = {
    method,
    body,
    query,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };

  return { req: mockReq, res: mockRes };
}

// Helper function to create JWT token
function createJwtToken(payload = mockUser) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
}

describe('/api/learn/progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/learn/progress', () => {
    test('should return progress for authenticated user', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('GET', {}, { chapterSlug: 'test-chapter' }, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(mockReadingProgress);

      await progressHandler(req, res);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockDb.where).toHaveBeenCalledWith('chapter_slug', 'test-chapter');
      expect(res.json).toHaveBeenCalledWith(mockReadingProgress);
    });

    test('should return 401 for unauthenticated request', async () => {
      const { req, res } = createMockReqRes('GET', {}, { chapterSlug: 'test-chapter' });

      await progressHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    test('should return null for non-existent progress', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('GET', {}, { chapterSlug: 'non-existent' }, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(null);

      await progressHandler(req, res);

      expect(res.json).toHaveBeenCalledWith(null);
    });

    test('should handle database errors gracefully', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('GET', {}, { chapterSlug: 'test-chapter' }, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockRejectedValue(new Error('Database error'));

      await progressHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('POST /api/learn/progress', () => {
    const progressData = {
      reading: {
        started: true,
        progressPercentage: 50,
        timeSpent: 600,
        lastRead: new Date().toISOString()
      }
    };

    test('should create new progress record', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', {
        chapterSlug: 'new-chapter',
        ...progressData
      }, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(null); // No existing progress
      mockDb.insert.mockResolvedValue([1]);

      await progressHandler(req, res);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should validate required fields', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', {
        // Missing chapterSlug
        ...progressData
      }, {}, {
        authorization: `Bearer ${token}`
      });

      await progressHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Chapter slug is required' });
    });

    test('should validate progress percentage range', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', {
        chapterSlug: 'test-chapter',
        reading: {
          progressPercentage: 150 // Invalid - over 100
        }
      }, {}, {
        authorization: `Bearer ${token}`
      });

      await progressHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Progress percentage must be between 0 and 100' 
      });
    });
  });

  describe('PUT /api/learn/progress', () => {
    const updateData = {
      reading: {
        progressPercentage: 100,
        completed: true,
        timeSpent: 1800
      }
    };

    test('should update existing progress record', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('PUT', {
        chapterSlug: 'test-chapter',
        ...updateData
      }, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(mockReadingProgress);
      mockDb.update.mockResolvedValue(1);

      await progressHandler(req, res);

      expect(mockDb.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('should return 404 for non-existent progress', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('PUT', {
        chapterSlug: 'non-existent',
        ...updateData
      }, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(null);

      await progressHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Progress record not found' });
    });
  });

  describe('Quiz Progress', () => {
    const quizData = {
      quiz: {
        completed: true,
        score: 85,
        timeSpent: 300,
        answers: [1, true, 'answer'],
        completedAt: new Date().toISOString()
      }
    };

    test('should update quiz progress', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('PUT', {
        chapterSlug: 'test-chapter',
        ...quizData
      }, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(mockReadingProgress);
      mockDb.update.mockResolvedValue(1);

      await progressHandler(req, res);

      expect(mockDb.update).toHaveBeenCalledWith(expect.objectContaining({
        quiz_completed: true,
        quiz_score: 85,
        quiz_time_spent: 300
      }));
    });

    test('should validate quiz score range', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('PUT', {
        chapterSlug: 'test-chapter',
        quiz: {
          score: 150 // Invalid - over 100
        }
      }, {}, {
        authorization: `Bearer ${token}`
      });

      await progressHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Quiz score must be between 0 and 100' 
      });
    });
  });
});

describe('/api/learn/notes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/learn/notes', () => {
    test('should return notes for authenticated user', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('GET', {}, { chapterSlug: 'test-chapter' }, {
        authorization: `Bearer ${token}`
      });

      mockDb.orderBy.mockReturnThis();
      mockDb.select.mockResolvedValue([mockUserNote]);

      await notesHandler(req, res);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(res.json).toHaveBeenCalledWith([mockUserNote]);
    });

    test('should filter by chapter slug when provided', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('GET', {}, { chapterSlug: 'specific-chapter' }, {
        authorization: `Bearer ${token}`
      });

      mockDb.orderBy.mockReturnThis();
      mockDb.select.mockResolvedValue([]);

      await notesHandler(req, res);

      expect(mockDb.where).toHaveBeenCalledWith('chapter_slug', 'specific-chapter');
    });
  });

  describe('POST /api/learn/notes', () => {
    const noteData = {
      chapterSlug: 'test-chapter',
      title: 'New Reflection',
      content: 'This is my reflection on the chapter.',
      tags: ['reflection', 'growth'],
      mood: 'hopeful',
      isPrivate: true
    };

    test('should create new note', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', noteData, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.insert.mockResolvedValue([1]);

      await notesHandler(req, res);

      expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockUser.id,
        chapter_slug: 'test-chapter',
        note_title: 'New Reflection',
        note_content: 'This is my reflection on the chapter.',
        tags: JSON.stringify(['reflection', 'growth'])
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should validate required fields', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', {
        // Missing title and content
        chapterSlug: 'test-chapter'
      }, {}, {
        authorization: `Bearer ${token}`
      });

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Title and content are required' 
      });
    });

    test('should validate content length', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', {
        chapterSlug: 'test-chapter',
        title: 'Test',
        content: 'x'.repeat(10001) // Too long
      }, {}, {
        authorization: `Bearer ${token}`
      });

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Content must be less than 10000 characters' 
      });
    });
  });

  describe('PUT /api/learn/notes', () => {
    const updateData = {
      id: 1,
      title: 'Updated Reflection',
      content: 'This is my updated reflection.',
      tags: ['reflection', 'update']
    };

    test('should update existing note', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('PUT', updateData, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(mockUserNote);
      mockDb.update.mockResolvedValue(1);

      await notesHandler(req, res);

      expect(mockDb.where).toHaveBeenCalledWith('id', 1);
      expect(mockDb.where).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockDb.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('should prevent updating notes of other users', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('PUT', updateData, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(null); // Note not found for this user

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Note not found' });
    });
  });

  describe('DELETE /api/learn/notes', () => {
    test('should delete user note', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('DELETE', {}, { id: '1' }, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(mockUserNote);
      mockDb.del.mockResolvedValue(1);

      await notesHandler(req, res);

      expect(mockDb.where).toHaveBeenCalledWith('id', '1');
      expect(mockDb.where).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockDb.del).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('should prevent deleting notes of other users', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('DELETE', {}, { id: '1' }, {
        authorization: `Bearer ${token}`
      });

      mockDb.first.mockResolvedValue(null);

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Note not found' });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', 'invalid json', {}, {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      });

      // Simulate JSON parsing error
      req.body = undefined;

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle invalid JWT tokens', async () => {
      const { req, res } = createMockReqRes('GET', {}, {}, {
        authorization: 'Bearer invalid-token'
      });

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    test('should handle missing authorization header', async () => {
      const { req, res } = createMockReqRes('GET');

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize user input', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', {
        chapterSlug: 'test-chapter',
        title: '<script>alert("xss")</script>Safe Title',
        content: 'Safe content with <b>allowed</b> HTML',
        tags: ['<script>', 'safe-tag']
      }, {}, {
        authorization: `Bearer ${token}`
      });

      mockDb.insert.mockResolvedValue([1]);

      await notesHandler(req, res);

      // Should strip dangerous HTML but allow safe HTML
      expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
        note_title: expect.not.stringContaining('<script>'),
        note_content: expect.stringContaining('<b>allowed</b>')
      }));
    });

    test('should validate tag format', async () => {
      const token = createJwtToken();
      const { req, res } = createMockReqRes('POST', {
        chapterSlug: 'test-chapter',
        title: 'Test',
        content: 'Test content',
        tags: 'not-an-array' // Should be array
      }, {}, {
        authorization: `Bearer ${token}`
      });

      await notesHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Tags must be an array' 
      });
    });
  });
}); 