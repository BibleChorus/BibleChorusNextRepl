import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { AddSeasonSongRequest } from '@/types/journey';

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
      const songs = await db('journey_season_songs')
        .where({ season_id: seasonId })
        .join('songs', 'journey_season_songs.song_id', 'songs.id')
        .select(
          'journey_season_songs.*',
          'songs.title as song_title',
          'songs.artist as song_artist',
          'songs.audio_url as song_audio_url',
          'songs.song_art_url as song_art_url',
          'songs.duration as song_duration',
          'songs.genres as song_genres'
        )
        .orderByRaw('COALESCE(songs.journey_date, songs.created_at) ASC');

      return res.status(200).json(songs);
    } catch (error) {
      console.error('Error fetching season songs:', error);
      return res.status(500).json({ error: 'Failed to fetch season songs' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data: AddSeasonSongRequest = req.body;

      if (!data.song_id) {
        return res.status(400).json({ error: 'Song ID is required' });
      }

      const song = await db('songs').where({ id: data.song_id }).first();
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }

      const existing = await db('journey_season_songs')
        .where({ season_id: seasonId, song_id: data.song_id })
        .first();

      if (existing) {
        return res.status(400).json({ error: 'Song already in this season' });
      }

      const maxOrder = await db('journey_season_songs')
        .where({ season_id: seasonId })
        .max('display_order as max')
        .first();

      const [seasonSong] = await db('journey_season_songs')
        .insert({
          season_id: seasonId,
          song_id: data.song_id,
          display_order: (maxOrder?.max || 0) + 1,
          personal_note: data.personal_note || null,
          significance: data.significance || null,
          added_date: data.added_date || song.created_at,
          source_url: data.source_url || null,
        })
        .returning('*');

      const fullSong = await db('journey_season_songs')
        .where({ 'journey_season_songs.id': seasonSong.id })
        .join('songs', 'journey_season_songs.song_id', 'songs.id')
        .select(
          'journey_season_songs.*',
          'songs.title as song_title',
          'songs.artist as song_artist',
          'songs.audio_url as song_audio_url',
          'songs.song_art_url as song_art_url',
          'songs.duration as song_duration',
          'songs.genres as song_genres'
        )
        .first();

      return res.status(201).json(fullSong);
    } catch (error) {
      console.error('Error adding song to season:', error);
      return res.status(500).json({ error: 'Failed to add song to season' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
