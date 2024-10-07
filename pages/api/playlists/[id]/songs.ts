import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { parsePostgresArray } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const songs = await db('playlist_songs')
        .join('songs', 'playlist_songs.song_id', 'songs.id')
        .join('users', 'songs.uploaded_by', 'users.id')
        .where('playlist_songs.playlist_id', id)
        .select(
          'songs.id',
          'songs.title',
          'users.username',
          'songs.uploaded_by',
          'songs.artist',
          'songs.genres',
          'songs.created_at',
          'songs.audio_url',
          'songs.song_art_url',
          'songs.bible_translation_used',
          'songs.lyrics_scripture_adherence',
          'songs.is_continuous_passage',
          'songs.ai_used_for_lyrics',
          'songs.music_ai_generated',
          'songs.music_model_used',
          'songs.duration',
          'songs.play_count'
        )
        .orderBy('playlist_songs.position');

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
        // Use parsePostgresArray to handle genres
        song.genres = parsePostgresArray(song.genres);
      });

      res.status(200).json(songs);
    } catch (error) {
      console.error('Error fetching playlist songs:', error);
      res.status(500).json({ message: 'Error fetching playlist songs', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}