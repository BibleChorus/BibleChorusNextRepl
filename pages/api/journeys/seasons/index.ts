import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { CreateSeasonRequest } from '@/types/journey';

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

  if (req.method === 'GET') {
    try {
      const seasons = await db('seasons')
        .where({ user_id: userId })
        .orderBy('display_order', 'asc')
        .orderBy('start_date', 'desc');

      for (const season of seasons) {
        const songCount = await db('journey_season_songs')
          .where({ season_id: season.id })
          .count('* as count')
          .first();
        season.song_count = parseInt(songCount?.count as string) || 0;
      }

      return res.status(200).json(seasons);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      return res.status(500).json({ error: 'Failed to fetch seasons' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data: CreateSeasonRequest = req.body;

      if (!data.title || !data.start_date) {
        return res.status(400).json({ error: 'Title and start date are required' });
      }

      const maxOrder = await db('seasons')
        .where({ user_id: userId })
        .max('display_order as max')
        .first();

      const [season] = await db('seasons')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description || null,
          start_date: data.start_date,
          end_date: data.end_date || null,
          year: data.year || new Date(data.start_date).getFullYear(),
          cover_image_url: data.cover_image_url || null,
          theme_color: data.theme_color || null,
          reflection: data.reflection || null,
          scripture_reference: data.scripture_reference || null,
          display_order: (maxOrder?.max || 0) + 1,
        })
        .returning('*');

      return res.status(201).json(season);
    } catch (error) {
      console.error('Error creating season:', error);
      return res.status(500).json({ error: 'Failed to create season' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
