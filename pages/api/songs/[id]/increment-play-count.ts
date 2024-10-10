import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db'; // Adjust the path as necessary

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      await db('songs')
        .where('id', id)
        .increment('play_count', 1);

      res.status(200).json({ message: 'Play count incremented successfully' });
    } catch (error) {
      console.error('Error incrementing play count:', error);
      res.status(500).json({ message: 'Error incrementing play count', error });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}