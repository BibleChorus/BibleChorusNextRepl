import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get total songs count
      const songsResult = await db('songs').count('id as count').first();
      const totalSongs = Number(songsResult?.count) || 0;

      // Get total users count
      const usersResult = await db('users').count('id as count').first();
      const totalUsers = Number(usersResult?.count) || 0;

      // Get total listens (sum of all play_count)
      const listensResult = await db('songs').sum('play_count as total').first();
      const totalListens = Number(listensResult?.total) || 0;

      res.status(200).json({
        totalSongs,
        totalUsers,
        totalListens
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}