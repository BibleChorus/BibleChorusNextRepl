import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { createdOnly } = req.query;

  if (req.method === 'GET') {
    try {
      let query = db('playlists')
        .select('playlists.*')
        .leftJoin('user_playlist_library', function() {
          this.on('playlists.id', '=', 'user_playlist_library.playlist_id')
              .andOn('user_playlist_library.user_id', '=', db.raw('?', [id]));
        });

      if (createdOnly === 'true') {
        // Only fetch playlists created by the user
        query = query.where('playlists.user_id', id);
      } else {
        // Fetch playlists created by the user, added to their library, or public playlists with no user
        query = query.where(function() {
          this.where('playlists.user_id', id)
              .orWhere('user_playlist_library.user_id', id)
              .orWhere(function() {
                this.where('playlists.is_public', true)
                    .whereNull('playlists.user_id');
              });
        });
      }

      // Add distinct to avoid duplicate results
      query = query.distinct('playlists.id');

      // Order by playlist ID in descending order
      query = query.orderBy('playlists.id', 'desc');

      const playlists = await query;

      res.status(200).json(playlists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      res.status(500).json({ message: 'Error fetching playlists', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}