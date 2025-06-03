import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
const knex = require('../../../db.js');

// Types for request/response
interface NoteRequest {
  chapter_slug?: string;
  note_content: string;
  note_type?: string;
  is_private?: boolean;
  is_favorite?: boolean;
  verse_reference?: string;
  tags?: string[];
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
 * Simple sentiment analysis (placeholder for more sophisticated analysis)
 */
function analyzeSentiment(text: string): string {
  const positiveWords = ['hope', 'joy', 'peace', 'love', 'grace', 'blessed', 'grateful', 'thankful', 'encouraged'];
  const negativeWords = ['struggle', 'difficult', 'hard', 'challenge', 'worry', 'fear', 'doubt', 'sin', 'guilt'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function sanitize(text: string): string {
  return text.replace(/<script.*?>.*?<\/script>/gi, '');
}

/**
 * GET /api/learn/notes
 * Retrieves all notes for the authenticated user
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    const chapter_slug = (req.query as any).chapter_slug || (req.query as any).chapterSlug;
    
    let query = knex('user_notes')
      .select('*')
      .where('user_id', user.id)
      .orderBy('created_at', 'desc');
    
    if (chapter_slug) {
      query = query.where('chapter_slug', chapter_slug as string);
    }
    
    const notes = await query;

    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
}

/**
 * POST /api/learn/notes
 * Creates a new note
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const {
      chapter_slug = req.body.chapterSlug,
      note_content = req.body.content,
      note_type = 'reflection',
      is_private = true,
      is_favorite = false,
      verse_reference,
      tags,
      title
    }: any = req.body;

    const note_title = req.body.note_title || title;
    const note = req.body.note || note_content;

    if (!chapter_slug || !note_title || !note) {
      return res.status(400).json({ message: 'chapter_slug and note are required' });
    }

    if (note.trim().length < 3) {
      return res.status(400).json({ message: 'Note must be at least 3 characters long' });
    }

    if (note.trim().length > 10000) {
      return res.status(400).json({ message: 'Content must be less than 10000 characters' });
    }

    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ message: 'Tags must be an array' });
    }

    // Calculate word count and analyze sentiment
    const wordCount = note.trim().split(/\s+/).length;
    const sentiment = analyzeSentiment(note);

    const cleanTitle = sanitize(note_title.trim());
    const cleanNote = sanitize(note.trim());

    const noteData = {
      user_id: user.id,
      chapter_slug,
      note_title: cleanTitle,
      note_content: cleanNote,
      note_type,
      is_private,
      is_favorite,
      verse_reference: verse_reference || null,
      tags: tags ? JSON.stringify(tags) : null,
      sentiment,
      word_count: wordCount,
    };

    await knex('user_notes').insert(noteData);
    const result = noteData;
    
    // Parse JSON fields for response
    const parsedResult = {
      ...result,
      tags: result.tags ? JSON.parse(result.tags) : null,
    };

    res.status(201).json(parsedResult);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Failed to create note' });
  }
}

/**
 * PUT /api/learn/notes/[id]
 * Updates an existing note
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    const noteIdStr = (req.query.id as string) || req.body.id;
    const noteId = parseInt(noteIdStr);
    
    if (!noteId || isNaN(noteId)) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    // Check if note exists and belongs to user
    const existingNote = await knex('user_notes')
      .where('id', noteIdStr)
      .where('user_id', user.id)
      .first();

    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const {
      note = req.body.content,
      note_type,
      is_private,
      is_favorite,
      verse_reference,
      tags,
      title
    }: any = req.body;
    const note_title_update = req.body.note_title ?? title;

    // Build update object with only provided fields
    const nowVal = knex.fn && typeof knex.fn.now === 'function' ? knex.fn.now() : new Date();
    const updateData: any = {
      updated_at: nowVal,
    };

    if (note !== undefined) {
      if (note.trim().length < 3) {
        return res.status(400).json({ message: 'Note must be at least 3 characters long' });
      }
      if (note.trim().length > 10000) {
        return res.status(400).json({ message: 'Content must be less than 10000 characters' });
      }
      const cleaned = sanitize(note.trim());
      updateData.note_content = cleaned;
      updateData.word_count = cleaned.split(/\s+/).length;
      updateData.sentiment = analyzeSentiment(cleaned);
    }

    if (note_title_update !== undefined) {
      updateData.note_title = sanitize(String(note_title_update).trim());
    }
    
    if (note_type !== undefined) updateData.note_type = note_type;
    if (is_private !== undefined) updateData.is_private = is_private;
    if (is_favorite !== undefined) updateData.is_favorite = is_favorite;
    if (verse_reference !== undefined) updateData.verse_reference = verse_reference;
    if (tags !== undefined) {
      if (tags && !Array.isArray(tags)) {
        return res.status(400).json({ message: 'Tags must be an array' });
      }
      updateData.tags = tags ? JSON.stringify(tags) : null;
    }

    await knex('user_notes')
      .where('id', noteIdStr)
      .where('user_id', user.id)
      .update(updateData);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Failed to update note' });
  }
}

/**
 * DELETE /api/learn/notes/[id]
 * Deletes a note
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    const noteId = parseInt(req.query.id as string);
    
    if (!noteId || isNaN(noteId)) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    // Check if note exists and belongs to user
    const noteIdStr = req.query.id as string;
    const existingNote = await knex('user_notes')
      .where({ id: noteIdStr, user_id: user.id })
      .first();

    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await knex('user_notes')
      .where('id', noteIdStr)
      .where('user_id', user.id)
      .del();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Failed to delete note' });
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
      case 'DELETE':
        return await handleDelete(req, res, user);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 