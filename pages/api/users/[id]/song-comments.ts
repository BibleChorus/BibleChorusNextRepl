import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      console.log('Fetching song comments for user:', id);
      const songComments = await db('song_comments')
        .where('user_id', id)
        .select('id', 'comment as content', 'created_at')
        .orderBy('created_at', 'desc');

      console.log('Fetched song comments:', songComments);
      res.status(200).json(songComments);
    } catch (error) {
      console.error('Error fetching song comments:', error);
      res.status(500).json({ message: 'Error fetching song comments', error: error.toString() });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
