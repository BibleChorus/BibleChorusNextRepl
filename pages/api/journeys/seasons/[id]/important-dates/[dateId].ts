import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { UpdateImportantDateRequest } from '@/types/journey';

const CDN_URL = process.env.CDN_URL || '';

function getUserIdFromRequest(req: NextApiRequest): number | null {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const seasonId = parseInt(req.query.id as string);
  const dateId = parseInt(req.query.dateId as string);

  if (isNaN(seasonId) || isNaN(dateId)) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  const season = await db('seasons')
    .where({ id: seasonId, user_id: userId })
    .first();

  if (!season) {
    return res.status(404).json({ error: 'Season not found' });
  }

  const importantDate = await db('journey_season_important_dates')
    .where({ id: dateId, season_id: seasonId })
    .first();

  if (!importantDate) {
    return res.status(404).json({ error: 'Important date not found' });
  }

  if (req.method === 'PUT') {
    try {
      const data: UpdateImportantDateRequest = req.body;

      const updates: Record<string, any> = {};

      if (data.title !== undefined) {
        const trimmedTitle = typeof data.title === 'string' ? data.title.trim() : '';
        if (!trimmedTitle) {
          return res.status(400).json({ error: 'Title cannot be empty' });
        }
        updates.title = trimmedTitle;
      }

      if (data.description !== undefined) {
        updates.description = data.description?.trim() || null;
      }

      if (data.event_date !== undefined) {
        if (!data.event_date) {
          return res.status(400).json({ error: 'Event date cannot be empty' });
        }
        updates.event_date = data.event_date;
      }

      if (data.photo_url !== undefined) {
        if (data.photo_url) {
          updates.photo_url = data.photo_url.startsWith('http') 
            ? data.photo_url 
            : `${CDN_URL}${data.photo_url.startsWith('/') ? data.photo_url.slice(1) : data.photo_url}`;
        } else {
          updates.photo_url = null;
        }
      }

      updates.updated_at = db.fn.now();

      const [updated] = await db('journey_season_important_dates')
        .where({ id: dateId, season_id: seasonId })
        .update(updates)
        .returning('*');

      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating important date:', error);
      return res.status(500).json({ error: 'Failed to update important date' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db('journey_season_important_dates')
        .where({ id: dateId, season_id: seasonId })
        .delete();

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting important date:', error);
      return res.status(500).json({ error: 'Failed to delete important date' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
