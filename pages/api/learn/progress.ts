import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
const knex = require('../../../db.js');

// Types for request/response
interface ProgressRequest {
  chapter_slug: string;
  action?: 'start' | 'update' | 'complete';
  reading_time_seconds?: number;
  scroll_progress_percent?: number;
  quiz_score?: number;
  quiz_answers?: any[];
  quiz_completed_at?: string;
  quiz_attempts?: number;
  completed_at?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

/**
 * Extracts and verifies JWT token from request
 */
function getUserFromToken(req: NextApiRequest): User | null {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.headers.cookie?.split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    return decoded.user || decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * GET /api/learn/progress
 * Retrieves all reading progress for the authenticated user
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    const { chapterSlug } = req.query as { chapterSlug?: string };
    let query = knex('reading_progress').select('*').where('user_id', user.id);

    if (chapterSlug) {
      const result = await query.where('chapter_slug', chapterSlug).first();
      return res.status(200).json(result || null);
    }

    const progress = await query.orderBy('created_at', 'desc');
    res.status(200).json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
}

/**
 * POST /api/learn/progress
 * Creates or updates reading progress for a chapter
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    const {
      chapter_slug = req.body.chapterSlug,
      action = 'start',
      reading
    }: any = req.body;

    if (reading && typeof reading.progressPercentage === 'number') {
      const pct = reading.progressPercentage;
      if (pct < 0 || pct > 100) {
        return res.status(400).json({ message: 'Progress percentage must be between 0 and 100' });
      }
    }

    if (!chapter_slug) {
      return res.status(400).json({ message: 'chapter_slug is required' });
    }

    // Check if progress already exists
    const existingProgress = await knex('reading_progress')
      .where({ user_id: user.id, chapter_slug })
      .first();

    let result;
    let created = false;

    if (existingProgress) {
      // Update existing progress
      const nowValue = knex.fn && typeof knex.fn.now === 'function' ? knex.fn.now() : new Date();
      const updateData: any = {
        last_visited_at: nowValue,
        visit_count: knex.raw('visit_count + 1'),
        updated_at: nowValue,
      };

      if (action === 'start') {
        // Just update visit info for existing progress
      } else if (action === 'complete') {
        updateData.completed_at = nowValue;
        updateData.scroll_progress_percent = 100;
      }

      await knex('reading_progress')
        .where({ user_id: user.id, chapter_slug })
        .update(updateData);

      result = await knex('reading_progress')
        .where({ user_id: user.id, chapter_slug })
        .first();
    } else {
      // Create new progress record
      const nowVal = knex.fn && typeof knex.fn.now === 'function' ? knex.fn.now() : new Date();
      const progressData = {
        user_id: user.id,
        chapter_slug,
        started_at: nowVal,
        completed_at: action === 'complete' ? nowVal : null,
        scroll_progress_percent: action === 'complete' ? 100 : 0,
        reading_time_seconds: 0,
        quiz_score: null,
        quiz_attempts: 0,
        quiz_completed_at: null,
        quiz_answers: null,
        visit_count: 1,
        last_visited_at: nowVal,
      };

      await knex('reading_progress').insert(progressData);
      result = progressData;
      created = true;
    }

    const statusCode = created ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error creating/updating progress:', error);
    res.status(500).json({ message: 'Failed to save progress' });
  }
}

/**
 * PUT /api/learn/progress
 * Updates specific progress fields for a chapter
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    const nowVal = knex.fn && typeof knex.fn.now === 'function' ? knex.fn.now() : new Date();
    const {
      chapter_slug = req.body.chapterSlug,
      reading,
      quiz,
      reading_time_seconds = reading?.timeSpent,
      scroll_progress_percent = reading?.progressPercentage,
      quiz_score = quiz?.score,
      quiz_answers = quiz?.answers,
      quiz_completed_at = quiz?.completedAt,
      quiz_attempts = quiz?.attempts,
      completed_at = reading?.completed ? nowVal : undefined
    }: any = req.body;

    if (!chapter_slug) {
      return res.status(400).json({ message: 'chapter_slug is required' });
    }

    // Ensure progress record exists
    const existingProgress = await knex('reading_progress')
      .where({ user_id: user.id, chapter_slug })
      .first();

    if (!existingProgress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: nowVal,
      last_visited_at: nowVal,
    };

    if (reading_time_seconds !== undefined) {
      updateData.reading_time_seconds = reading_time_seconds;
    }
    if (scroll_progress_percent !== undefined) {
      updateData.scroll_progress_percent = scroll_progress_percent;
    }
    if (quiz_score !== undefined) {
      if (quiz_score < 0 || quiz_score > 100) {
        return res.status(400).json({ message: 'Quiz score must be between 0 and 100' });
      }
      updateData.quiz_score = quiz_score;
    }
    if (quiz_answers !== undefined) {
      updateData.quiz_answers = JSON.stringify(quiz_answers);
    }
    if (quiz_completed_at !== undefined) {
      updateData.quiz_completed_at = quiz_completed_at;
    }
    if (quiz_attempts !== undefined) {
      updateData.quiz_attempts = quiz_attempts;
    }
    if (quiz && quiz.completed !== undefined) {
      updateData.quiz_completed = quiz.completed;
    }
    if (quiz && quiz.timeSpent !== undefined) {
      updateData.quiz_time_spent = quiz.timeSpent;
    }
    if (completed_at !== undefined) {
      updateData.completed_at = completed_at;
    }

    await knex('reading_progress')
      .where({ user_id: user.id, chapter_slug })
      .update(updateData);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
}

/**
 * Main API handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate user
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, user);
      case 'POST':
        return await handlePost(req, res, user);
      case 'PUT':
        return await handlePut(req, res, user);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 