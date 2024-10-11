import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { createdOnly } = req.query;

  if (req.method === 'GET') {
    try {
      let query = db('playlists')
        .select('id', 'name', 'description', 'created_at', 'is_public', 'is_auto', 'cover_art_url', 'user_id')
        .where('user_id', id);

      if (createdOnly === 'true') {
        // Only fetch playlists created by the user
        query = query.where('user_id', id);
      } else {
        // Fetch all playlists accessible to the user (created + collaborative)
        query = query.where(function() {
          this.where('user_id', id)
            .orWhere('is_public', true)
            .orWhereExists(function() {
              this.select('*')
                .from('user_playlist_library')
                .whereRaw('user_playlist_library.playlist_id = playlists.id')
                .andWhere('user_playlist_library.user_id', id);
            });
        });
      }

      const playlists = await query.orderBy('id', 'desc');
      res.status(200).json(playlists);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      res.status(500).json({ message: 'Error fetching user playlists', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}