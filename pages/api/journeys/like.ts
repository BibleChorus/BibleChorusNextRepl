import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';

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

  const { journey_id } = req.body;
  const journeyId = Number(journey_id);

  if (!journeyId || isNaN(journeyId)) {
    return res.status(400).json({ error: 'Invalid journey ID' });
  }

  const journey = await db('journey_profiles')
    .where({ id: journeyId })
    .first();

  if (!journey) {
    return res.status(404).json({ error: 'Journey not found' });
  }

  if (req.method === 'POST') {
    try {
      const existingLike = await db('likes')
        .where({
          user_id: userId,
          likeable_type: 'journey',
          likeable_id: journeyId,
        })
        .first();

      if (existingLike) {
        return res.status(400).json({ error: 'Already liked this journey' });
      }

      await db('likes').insert({
        user_id: userId,
        likeable_type: 'journey',
        likeable_id: journeyId,
      });

      await db('journey_profiles')
        .where({ id: journeyId })
        .increment('likes_count', 1);

      const updated = await db('journey_profiles')
        .where({ id: journeyId })
        .select('likes_count')
        .first();

      return res.status(201).json({
        liked: true,
        likes_count: updated.likes_count,
      });
    } catch (error) {
      console.error('Error liking journey:', error);
      return res.status(500).json({ error: 'Failed to like journey' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await db('likes')
        .where({
          user_id: userId,
          likeable_type: 'journey',
          likeable_id: journeyId,
        })
        .del();

      if (deleted > 0) {
        await db('journey_profiles')
          .where({ id: journeyId })
          .decrement('likes_count', 1);
      }

      const updated = await db('journey_profiles')
        .where({ id: journeyId })
        .select('likes_count')
        .first();

      return res.status(200).json({
        liked: false,
        likes_count: Math.max(0, updated.likes_count),
      });
    } catch (error) {
      console.error('Error unliking journey:', error);
      return res.status(500).json({ error: 'Failed to unlike journey' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
