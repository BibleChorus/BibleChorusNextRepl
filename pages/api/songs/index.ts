import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { lyricsAdherence, isContinuous, aiMusic } = req.query;

      let query = db('songs')
        .select(
          'songs.id',
          'songs.title',
          'users.username',
          'songs.uploaded_by',
          'songs.genre',
          'songs.created_at',
          'songs.audio_url',
          'songs.song_art_url',
          'songs.bible_translation_used',
          'songs.lyrics_scripture_adherence',
          'songs.is_continuous_passage'
        )
        .join('users', 'songs.uploaded_by', 'users.id');

      if (lyricsAdherence !== 'all') {
        query = query.where('lyrics_scripture_adherence', lyricsAdherence);
      }

      if (isContinuous !== 'all') {
        query = query.where('is_continuous_passage', isContinuous === 'true');
      }

      if (aiMusic !== 'all') {
        query = query.where('music_ai_generated', aiMusic === 'true');
      }

      const songs = await query.orderBy('songs.created_at', 'desc');

      // Fetch Bible verses for each song
      for (let song of songs) {
        const verses = await db('song_verses')
          .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
          .where('song_verses.song_id', song.id)
          .select('bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse')
          .orderBy(['bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse']);

        song.bible_verses = verses;
      }

      res.status(200).json(songs);
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.status(500).json({ message: 'Error fetching songs', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}