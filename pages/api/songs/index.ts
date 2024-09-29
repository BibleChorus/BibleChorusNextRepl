import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Log incoming query parameters
      console.log('Received query parameters:', req.query);

      const { lyricsAdherence, isContinuous, aiMusic, genres } = req.query;

      // Log individual parameters
      console.log('lyricsAdherence:', lyricsAdherence);
      console.log('isContinuous:', isContinuous);
      console.log('aiMusic:', aiMusic);
      console.log('genres:', genres);

      // Ensure lyricsAdherence and genres are always arrays
      let adherenceValues: string[] = [];
      if (lyricsAdherence) {
        adherenceValues = Array.isArray(lyricsAdherence)
          ? lyricsAdherence
          : [lyricsAdherence];
      }

      let genreValues: string[] = [];
      if (genres) {
        genreValues = Array.isArray(genres)
          ? genres
          : [genres];
      }

      // Log the normalized values
      console.log('Normalized adherenceValues:', adherenceValues);
      console.log('Normalized genreValues:', genreValues);

      let query = db('songs')
        .select(
          'songs.id',
          'songs.title',
          'users.username',
          'songs.uploaded_by',
          // Remove 'songs.genre',
          'songs.genres', // Add this line to select the new 'genres' column
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

      // Apply the genre filter
      if (genreValues.length > 0) {
        genreValues = genreValues.map(value => value.toLowerCase());
        query = query.whereRaw('genres @> ARRAY[?]::text[]', [genreValues]);
      }

      const songs = await query
        .select(
          'songs.id',
          'songs.title',
          'users.username',
          'songs.uploaded_by',
          'songs.genres', // Include the genres array
          'songs.created_at',
          'songs.audio_url',
          'songs.song_art_url',
          'songs.bible_translation_used',
          'songs.lyrics_scripture_adherence',
          'songs.is_continuous_passage'
        )
        .orderBy('songs.created_at', 'desc');

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