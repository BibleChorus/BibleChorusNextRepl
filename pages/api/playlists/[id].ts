import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const playlistId = Number(id);

  if (req.method === 'PUT') {
    try {
      const { name, description, is_public } = req.body;
      
      const [updatedPlaylist] = await db('playlists')
        .where({ id: playlistId })
        .update({
          name,
          description,
          is_public,
          last_updated: new Date(),
        })
        .returning('*');

      res.status(200).json(updatedPlaylist);
    } catch (error) {
      console.error('Error updating playlist:', error);
      res.status(500).json({ message: 'Error updating playlist', error });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { song_ids } = req.body;

      await db('playlist_songs')
        .where({ playlist_id: playlistId })
        .whereIn('song_id', song_ids)
        .del();

      const [updatedPlaylist] = await db('playlists')
        .where({ id: playlistId })
        .update({ last_updated: new Date() })
        .returning('*');

      res.status(200).json(updatedPlaylist);
    } catch (error) {
      console.error('Error removing songs from playlist:', error);
      res.status(500).json({ message: 'Error removing songs from playlist', error });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
