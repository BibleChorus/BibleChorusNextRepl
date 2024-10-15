import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const songId = Number(req.query.id);

  if (method === 'GET') {
    try {
      const [{ count }] = await db('song_comments')
        .where('song_id', songId)
        .count('id');

      res.status(200).json({ count: Number(count) });
    } catch (error) {
      console.error('Error fetching comments count:', error);
      res.status(500).json({ message: 'Error fetching comments count' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
