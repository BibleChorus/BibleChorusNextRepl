import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { JourneyWithSeasons } from '@/types/journey';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const user = await db('users')
      .where({ username })
      .select('id', 'username', 'profile_image_url')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserId = getUserIdFromRequest(req);
    const isOwner = currentUserId === user.id;

    let profile = await db('journey_profiles')
      .where({ user_id: user.id })
      .first();

    if (!profile) {
      if (isOwner) {
        [profile] = await db('journey_profiles')
          .insert({
            user_id: user.id,
            title: `${user.username}'s Musical Journey`,
          })
          .returning('*');
      } else {
        return res.status(404).json({ error: 'Journey not found' });
      }
    }

    if (!profile.is_public && !isOwner) {
      return res.status(403).json({ error: 'This journey is private' });
    }

    const seasonsQuery = db('seasons')
      .where({ user_id: user.id })
      .orderBy('display_order', 'asc')
      .orderBy('start_date', 'desc');

    if (!isOwner) {
      seasonsQuery.where({ is_visible: true });
    }

    const seasons = await seasonsQuery;

    for (const season of seasons) {
      const seasonSongs = await db('journey_season_songs')
        .where({ season_id: season.id })
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
          'songs.journey_date as song_journey_date',
          'songs.is_journey_song as song_is_journey_song',
          'songs.journey_song_origin as song_journey_song_origin',
          'songs.genres as song_genres',
          'songs.lyrics as song_lyrics',
          'songs.bible_translation_used as song_bible_translation_used'
        )
        .orderBy('journey_season_songs.display_order', 'asc');

      for (const ss of seasonSongs) {
        const bibleVerses = await db('bible_verses')
          .whereRaw('? = ANY(ai_lyrics_song_ids) OR ? = ANY(human_lyrics_song_ids)', [ss.song_id, ss.song_id])
          .select('book', 'chapter', 'verse');
        ss.bible_verses = bibleVerses;
      }

      season.songs = seasonSongs.map((ss: any) => ({
        id: ss.id,
        season_id: ss.season_id,
        song_id: ss.song_id,
        display_order: ss.display_order,
        personal_note: ss.personal_note,
        significance: ss.significance,
        added_date: ss.added_date,
        source_url: ss.source_url,
        created_at: ss.created_at,
        song: {
          id: ss.song_id,
          title: ss.song_title,
          artist: ss.song_artist,
          audio_url: ss.song_audio_url,
          song_art_url: ss.song_art_url,
          duration: ss.song_duration,
          play_count: profile.show_play_counts ? ss.song_play_count : undefined,
          created_at: profile.show_song_dates ? ss.song_created_at : undefined,
          journey_date: ss.song_journey_date || ss.song_created_at,
          is_journey_song: ss.song_is_journey_song,
          journey_song_origin: ss.song_journey_song_origin,
          genres: ss.song_genres,
          lyrics: ss.song_lyrics,
          bible_translation_used: ss.song_bible_translation_used,
          bible_verses: ss.bible_verses,
        },
      }));
    }

    const journey: JourneyWithSeasons = {
      ...profile,
      username: user.username,
      profile_image_url: user.profile_image_url,
      seasons,
    };

    return res.status(200).json(journey);
  } catch (error) {
    console.error('Error fetching journey:', error);
    return res.status(500).json({ error: 'Failed to fetch journey' });
  }
}
