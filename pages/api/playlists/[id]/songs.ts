import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { parsePostgresArray } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const playlistId = Number(id);

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
  } else if (req.method === 'POST') {
    const { song_ids } = req.body;
    const user_id = req.body.user_id || req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!Array.isArray(song_ids) || song_ids.length === 0) {
      return res.status(400).json({ message: 'song_ids is required and should be a non-empty array' });
    }

    try {
      const existingSongs = await db('playlist_songs')
        .where('playlist_id', playlistId)
        .pluck('song_id');

      const newSongs = song_ids.filter((song_id: number) => !existingSongs.includes(song_id));

      if (newSongs.length > 0) {
        const maxPosition = await db('playlist_songs')
          .where('playlist_id', playlistId)
          .max('position as maxPosition')
          .first();

        const startPosition = (maxPosition?.maxPosition || 0) + 1;

        const playlistSongs = newSongs.map((song_id: number, index: number) => ({
          playlist_id: playlistId,
          song_id,
          position: startPosition + index,
          added_by: user_id,
          added_at: new Date(),
        }));

        await db.batchInsert('playlist_songs', playlistSongs);
      }

      res.status(200).json({ message: 'Songs added to playlist' });
    } catch (error) {
      console.error('Error adding songs to playlist:', error);
      res.status(500).json({ message: 'Error adding songs to playlist', error });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}