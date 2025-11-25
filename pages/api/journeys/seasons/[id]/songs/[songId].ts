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

  const seasonId = parseInt(req.query.id as string);
  const songId = parseInt(req.query.songId as string);

  if (isNaN(seasonId) || isNaN(songId)) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  const season = await db('seasons')
    .where({ id: seasonId, user_id: userId })
    .first();

  if (!season) {
    return res.status(404).json({ error: 'Season not found' });
  }

  const seasonSong = await db('journey_season_songs')
    .where({ season_id: seasonId, song_id: songId })
    .first();

  if (!seasonSong) {
    return res.status(404).json({ error: 'Song not in this season' });
  }

  if (req.method === 'PUT') {
    try {
      const { personal_note, significance, display_order } = req.body;

      const updates: Record<string, any> = {};
      if (personal_note !== undefined) updates.personal_note = personal_note;
      if (significance !== undefined) updates.significance = significance;
      if (display_order !== undefined) updates.display_order = display_order;

      const [updated] = await db('journey_season_songs')
        .where({ season_id: seasonId, song_id: songId })
        .update(updates)
        .returning('*');

      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating season song:', error);
      return res.status(500).json({ error: 'Failed to update song' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db('journey_season_songs')
        .where({ season_id: seasonId, song_id: songId })
        .delete();

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error removing song from season:', error);
      return res.status(500).json({ error: 'Failed to remove song' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
