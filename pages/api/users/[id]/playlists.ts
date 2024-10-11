import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { createdOnly } = req.query; // New query parameter

  if (req.method === 'GET') {
    try {
      let query = db('playlists')
        .where('user_id', id)
        .select('id', 'name', 'description', 'created_at', 'is_public', 'is_auto', 'cover_art_url', 'user_id')
        .orderBy('id', 'desc');

      // If createdOnly is true, we don't need to fetch public or auto playlists
      if (createdOnly !== 'true') {
        const publicPlaylists = await db('playlists')
          .where('is_public', true)
          .andWhereNot('user_id', id)
          .select('id', 'name', 'description', 'created_at', 'is_public', 'is_auto', 'cover_art_url', 'user_id')
          .orderBy('id', 'desc');

        const autoPlaylists = await db('playlists')
          .whereNull('user_id')
          .select('id', 'name', 'description', 'created_at', 'is_public', 'is_auto', 'cover_art_url', 'user_id')
          .orderBy('id', 'desc');

        query = query.union(publicPlaylists).union(autoPlaylists);
      }

      const playlists = await query;

      // Fetch usernames for public playlists only if we're including them
      if (createdOnly !== 'true') {
        const userIds = new Set(playlists.filter(p => p.user_id && p.user_id !== Number(id)).map(p => p.user_id));
        const users = await db('users')
          .whereIn('id', Array.from(userIds))
          .select('id', 'username');

        const userMap = new Map(users.map(user => [user.id, user.username]));

        playlists.forEach(playlist => {
          playlist.creator_username = playlist.user_id 
            ? (playlist.user_id === Number(id) ? 'You' : userMap.get(playlist.user_id) || 'Unknown')
            : 'Auto Playlist';
        });
      }

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