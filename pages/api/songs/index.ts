import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Log incoming query parameters
      console.log('Received query parameters:', req.query);

      const { lyricsAdherence, isContinuous, aiMusic } = req.query;

      // Log individual parameters
      console.log('lyricsAdherence:', lyricsAdherence);
      console.log('isContinuous:', isContinuous);
      console.log('aiMusic:', aiMusic);

      // Ensure lyricsAdherence is always an array
      let adherenceValues: string[] = [];
      if (lyricsAdherence) {
        adherenceValues = Array.isArray(lyricsAdherence)
          ? lyricsAdherence
          : [lyricsAdherence];
      }

      // Log the normalized adherenceValues
      console.log('Normalized adherenceValues:', adherenceValues);

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

      // Apply the lyricsAdherence filter with case-insensitive matching
      if (adherenceValues.length > 0) {
        query = query.where((builder) => {
          adherenceValues.forEach((value, index) => {
            if (index === 0) {
              builder.whereRaw('LOWER(songs.lyrics_scripture_adherence) = LOWER(?)', value);
            } else {
              builder.orWhereRaw('LOWER(songs.lyrics_scripture_adherence) = LOWER(?)', value);
            }
          });
        });
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
      res.status(500).json({ message: 'Error fetching songs', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}