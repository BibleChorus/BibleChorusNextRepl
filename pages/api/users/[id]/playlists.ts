import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Fetch user's own playlists
      const userPlaylists = await db('playlists')
        .where('user_id', id)
        .select('id', 'name', 'description', 'created_at', 'is_public', 'is_auto', 'cover_art_url', 'user_id')
        .orderBy('id', 'desc'); // Add this line to sort in descending order of id

      // Fetch public playlists created by other users
      const publicPlaylists = await db('playlists')
        .where('is_public', true)
        .andWhereNot('user_id', id)
        .select('id', 'name', 'description', 'created_at', 'is_public', 'is_auto', 'cover_art_url', 'user_id')
        .orderBy('id', 'desc'); // Add this line to sort in descending order of id

      // Fetch auto playlists (where creator is null)
      const autoPlaylists = await db('playlists')
        .whereNull('user_id')
        .select('id', 'name', 'description', 'created_at', 'is_public', 'is_auto', 'cover_art_url', 'user_id')
        .orderBy('id', 'desc'); // Add this line to sort in descending order of id

      // Combine all playlists
      const allPlaylists = [
        ...userPlaylists,
        ...publicPlaylists,
        ...autoPlaylists
      ];

      // Fetch usernames for public playlists
      const userIds = new Set(publicPlaylists.map(playlist => playlist.user_id));
      const users = await db('users')
        .whereIn('id', Array.from(userIds))
        .select('id', 'username');

      const userMap = new Map(users.map(user => [user.id, user.username]));

      // Add creator_username to playlists
      const playlistsWithCreators = allPlaylists.map(playlist => ({
        ...playlist,
        creator_username: playlist.user_id 
          ? (playlist.user_id === Number(id) ? 'You' : userMap.get(playlist.user_id) || 'Unknown')
          : 'Auto Playlist'
      }));

      res.status(200).json(playlistsWithCreators);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      res.status(500).json({ message: 'Error fetching user playlists', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}