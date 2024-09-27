import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';  // Adjust the path to your db module if necessary

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch all songs from the database, including song_art_url
      const songs = await db('songs')
        .select('id', 'title', 'artist', 'genre', 'created_at', 'audio_url', 'song_art_url', 'bible_translation_used', 'lyrics_scripture_adherence', 'is_continuous_passage')
        .orderBy('created_at', 'desc');
      res.status(200).json(songs);
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.status(500).json({ message: 'Error fetching songs', error });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}