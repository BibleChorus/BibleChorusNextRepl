import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { auth } from '@/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await auth(req, res);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id);
  const { search, exclude_season } = req.query;

  try {
    let query = db('songs')
      .where({ uploaded_by: userId })
      .select('id', 'title', 'artist', 'audio_url', 'song_art_url', 'duration', 'genres', 'created_at')
      .orderBy('created_at', 'desc');

    if (search && typeof search === 'string') {
      query = query.where(function() {
        this.whereILike('title', `%${search}%`)
          .orWhereILike('artist', `%${search}%`);
      });
    }

    if (exclude_season && typeof exclude_season === 'string') {
      const seasonId = parseInt(exclude_season);
      if (!isNaN(seasonId)) {
        const existingSongIds = await db('journey_season_songs')
          .where({ season_id: seasonId })
          .pluck('song_id');
        
        if (existingSongIds.length > 0) {
          query = query.whereNotIn('id', existingSongIds);
        }
      }
    }

    const songs = await query.limit(50);

    return res.status(200).json(songs);
  } catch (error) {
    console.error('Error fetching user songs:', error);
    return res.status(500).json({ error: 'Failed to fetch songs' });
  }
}
