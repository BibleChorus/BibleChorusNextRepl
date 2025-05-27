import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
const knex = require('../../../db');

// Types for request/response
interface NoteRequest {
  chapter_slug?: string;
  note: string;
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

/**
 * GET /api/learn/notes
 * Retrieves all notes for the authenticated user
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: User) {
  try {
    const { chapter_slug } = req.query;
    
    let query = knex('user_notes')
      .where('user_id', user.id)
      .orderBy('created_at', 'desc');
    
    if (chapter_slug) {
      query = query.where('chapter_slug', chapter_slug as string);
    }
    
    const notes = await query;
    
    // Parse JSON fields
    const parsedNotes = notes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : null,
    }));

    res.status(200).json(parsedNotes);
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
    const { 
      chapter_slug, 
      note, 
      note_type = 'reflection',
      is_private = true,
      is_favorite = false,
      verse_reference,
      tags
    }: NoteRequest = req.body;

    if (!chapter_slug || !note) {
      return res.status(400).json({ message: 'chapter_slug and note are required' });
    }

    if (note.trim().length < 3) {
      return res.status(400).json({ message: 'Note must be at least 3 characters long' });
    }

    // Calculate word count and analyze sentiment
    const wordCount = note.trim().split(/\s+/).length;
    const sentiment = analyzeSentiment(note);

    const noteData = {
      user_id: user.id,
      chapter_slug,
      note: note.trim(),
      note_type,
      is_private,
      is_favorite,
      verse_reference: verse_reference || null,
      tags: tags ? JSON.stringify(tags) : null,
      sentiment,
      word_count: wordCount,
    };

    const [id] = await knex('user_notes').insert(noteData).returning('id');
    const result = await knex('user_notes').where('id', id).first();
    
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
    const noteId = parseInt(req.query.id as string);
    
    if (!noteId || isNaN(noteId)) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    // Check if note exists and belongs to user
    const existingNote = await knex('user_notes')
      .where({ id: noteId, user_id: user.id })
      .first();

    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const { 
      note, 
      note_type,
      is_private,
      is_favorite,
      verse_reference,
      tags
    }: Partial<NoteRequest> = req.body;

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: knex.fn.now(),
    };

    if (note !== undefined) {
      if (note.trim().length < 3) {
        return res.status(400).json({ message: 'Note must be at least 3 characters long' });
      }
      updateData.note = note.trim();
      updateData.word_count = note.trim().split(/\s+/).length;
      updateData.sentiment = analyzeSentiment(note);
    }
    
    if (note_type !== undefined) updateData.note_type = note_type;
    if (is_private !== undefined) updateData.is_private = is_private;
    if (is_favorite !== undefined) updateData.is_favorite = is_favorite;
    if (verse_reference !== undefined) updateData.verse_reference = verse_reference;
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;

    await knex('user_notes')
      .where({ id: noteId, user_id: user.id })
      .update(updateData);

    const result = await knex('user_notes').where('id', noteId).first();
    
    // Parse JSON fields for response
    const parsedResult = {
      ...result,
      tags: result.tags ? JSON.parse(result.tags) : null,
    };

    res.status(200).json(parsedResult);
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
    const existingNote = await knex('user_notes')
      .where({ id: noteId, user_id: user.id })
      .first();

    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await knex('user_notes')
      .where({ id: noteId, user_id: user.id })
      .delete();

    res.status(200).json({ message: 'Note deleted successfully' });
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