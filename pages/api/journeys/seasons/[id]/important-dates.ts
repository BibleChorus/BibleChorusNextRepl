import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { CreateImportantDateRequest } from '@/types/journey';

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

  if (isNaN(seasonId)) {
    return res.status(400).json({ error: 'Invalid season ID' });
  }

  const season = await db('seasons')
    .where({ id: seasonId, user_id: userId })
    .first();

  if (!season) {
    return res.status(404).json({ error: 'Season not found' });
  }

  if (req.method === 'GET') {
    try {
      const importantDates = await db('journey_season_important_dates')
        .where({ season_id: seasonId })
        .orderBy('event_date', 'asc');

      return res.status(200).json(importantDates);
    } catch (error) {
      console.error('Error fetching important dates:', error);
      return res.status(500).json({ error: 'Failed to fetch important dates' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data: CreateImportantDateRequest = req.body;

      if (!data.title || !data.title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }

      if (!data.event_date) {
        return res.status(400).json({ error: 'Event date is required' });
      }

      const maxOrder = await db('journey_season_important_dates')
        .where({ season_id: seasonId })
        .max('display_order as max')
        .first();

      const [importantDate] = await db('journey_season_important_dates')
        .insert({
          season_id: seasonId,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          event_date: data.event_date,
          photo_url: data.photo_url || null,
          display_order: (maxOrder?.max || 0) + 1,
        })
        .returning('*');

      return res.status(201).json(importantDate);
    } catch (error) {
      console.error('Error creating important date:', error);
      return res.status(500).json({ error: 'Failed to create important date' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
