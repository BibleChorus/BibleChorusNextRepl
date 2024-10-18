import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { parsePostgresArray } from '@/lib/utils';

// Add this type declaration
interface AuthenticatedRequest extends NextApiRequest {
  user?: { id: number };
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const playlistId = Number(id);

  if (req.method === 'POST') {
    const { song_ids, user_id } = req.body;

    // Check if user_id is provided in the request body
    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized: User ID not provided' });
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
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
