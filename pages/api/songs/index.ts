import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const {
        lyricsAdherence,
        isContinuous,
        aiMusic,
        genres,
        aiUsedForLyrics,
        musicModelUsed,
        title,
        artist,
        bibleTranslation,
        bibleBooks,
        page = '1',
        limit = '20',
        search,
      } = req.query;

      const limitNum = parseInt(limit as string, 10);
      const offset = (parseInt(page as string, 10) - 1) * limitNum;

      let query = db('songs')
        .select(
          'songs.id',
          'songs.title',
          'users.username',
          'songs.uploaded_by',
          'songs.genres',
          'songs.created_at',
          'songs.audio_url',
          'songs.song_art_url',
          'songs.bible_translation_used',
          'songs.lyrics_scripture_adherence',
          'songs.is_continuous_passage',
          'songs.ai_used_for_lyrics',
          'songs.music_ai_generated',
          'songs.music_model_used'
        )
        .join('users', 'songs.uploaded_by', 'users.id')
        .limit(limitNum)
        .offset(offset);

      // Apply filters
      if (lyricsAdherence) {
        const adherenceValues = Array.isArray(lyricsAdherence) ? lyricsAdherence : [lyricsAdherence];
        query = query.whereIn('songs.lyrics_scripture_adherence', adherenceValues);
      }

      if (isContinuous && isContinuous !== 'all') {
        query = query.where('songs.is_continuous_passage', isContinuous === 'true');
      }

      if (aiMusic && aiMusic !== 'all') {
        query = query.where('songs.music_ai_generated', aiMusic === 'true');
      }

      if (genres) {
        const genresValues = Array.isArray(genres) ? genres : [genres];
        query = query.whereRaw('genres && ?', [genresValues]);
      }

      if (aiUsedForLyrics && aiUsedForLyrics !== 'all') {
        query = query.where('songs.ai_used_for_lyrics', aiUsedForLyrics === 'true');
      }

      if (musicModelUsed) {
        query = query.where('songs.music_model_used', musicModelUsed);
      }

      if (bibleTranslation) {
        query = query.where('songs.bible_translation_used', bibleTranslation);
      }

      if (bibleBooks) {
        const bibleBooksValues = Array.isArray(bibleBooks) ? bibleBooks : [bibleBooks];

        query = query
          .join('song_verses', 'songs.id', 'song_verses.song_id')
          .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
          .whereIn('bible_verses.book', bibleBooksValues);
      }

      // Full-text search on lyrics, prompts, genres, and title
      if (search) {
        const searchTerm = search as string;
        query = query.whereRaw("search_vector @@ plainto_tsquery('english', ?)", [searchTerm]);
      }

      query = query.orderBy('songs.created_at', 'desc');

      // Get total count for pagination
      const totalQuery = query.clone().clearSelect().clearOrder().countDistinct('songs.id as total');
      const totalResult = await totalQuery.first();
      const total = totalResult ? Number(totalResult.total) : 0;

      const songs = await query;

      // Fetch Bible verses for each song
      const songIds = songs.map(song => song.id);

      const verses = await db('song_verses')
        .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
        .whereIn('song_verses.song_id', songIds)
        .select('song_verses.song_id', 'bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse')
        .orderBy(['bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse']);

      // Attach verses to songs
      const versesBySongId = verses.reduce((acc, verse) => {
        if (!acc[verse.song_id]) {
          acc[verse.song_id] = [];
        }
        acc[verse.song_id].push({ book: verse.book, chapter: verse.chapter, verse: verse.verse });
        return acc;
      }, {});

      songs.forEach(song => {
        song.bible_verses = versesBySongId[song.id] || [];
      });

      res.status(200).json({ songs, total });
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.status(500).json({ message: 'Error fetching songs', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}