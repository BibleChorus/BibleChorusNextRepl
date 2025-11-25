import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { UpdateSeasonRequest } from '@/types/journey';

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

  const existingSeason = await db('seasons')
    .where({ id: seasonId, user_id: userId })
    .first();

  if (!existingSeason) {
    return res.status(404).json({ error: 'Season not found' });
  }

  if (req.method === 'GET') {
    try {
      const seasonSongs = await db('journey_season_songs')
        .where({ season_id: seasonId })
        .join('songs', 'journey_season_songs.song_id', 'songs.id')
        .select(
          'journey_season_songs.*',
          'songs.id as song_id',
          'songs.title as song_title',
          'songs.artist as song_artist',
          'songs.audio_url as song_audio_url',
          'songs.song_art_url as song_art_url',
          'songs.duration as song_duration',
          'songs.play_count as song_play_count',
          'songs.created_at as song_created_at',
          'songs.genres as song_genres'
        )
        .orderBy('journey_season_songs.display_order', 'asc');

      existingSeason.songs = seasonSongs.map((ss: any) => ({
        id: ss.id,
        season_id: ss.season_id,
        song_id: ss.song_id,
        display_order: ss.display_order,
        personal_note: ss.personal_note,
        significance: ss.significance,
        added_date: ss.added_date,
        created_at: ss.created_at,
        song: {
          id: ss.song_id,
          title: ss.song_title,
          artist: ss.song_artist,
          audio_url: ss.song_audio_url,
          song_art_url: ss.song_art_url,
          duration: ss.song_duration,
          play_count: ss.song_play_count,
          created_at: ss.song_created_at,
          genres: ss.song_genres,
        },
      }));

      return res.status(200).json(existingSeason);
    } catch (error) {
      console.error('Error fetching season:', error);
      return res.status(500).json({ error: 'Failed to fetch season' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updates: UpdateSeasonRequest = req.body;

      const allowedFields = [
        'title', 'description', 'start_date', 'end_date', 'year',
        'cover_image_url', 'theme_color', 'display_order', 'is_visible',
        'reflection', 'scripture_reference'
      ];

      const sanitizedUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key as keyof UpdateSeasonRequest] !== undefined) {
          sanitizedUpdates[key] = updates[key as keyof UpdateSeasonRequest];
        }
      }
      sanitizedUpdates.updated_at = db.fn.now();

      const [updatedSeason] = await db('seasons')
        .where({ id: seasonId, user_id: userId })
        .update(sanitizedUpdates)
        .returning('*');

      return res.status(200).json(updatedSeason);
    } catch (error) {
      console.error('Error updating season:', error);
      return res.status(500).json({ error: 'Failed to update season' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db('seasons')
        .where({ id: seasonId, user_id: userId })
        .delete();

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting season:', error);
      return res.status(500).json({ error: 'Failed to delete season' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
