import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { parsePostgresArray } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const song = await db('songs').where('id', id).first();

      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      // Parse the genres field to ensure it's an array
      song.genres = parsePostgresArray(song.genres);

      res.status(200).json(song);
    } catch (error) {
      console.error('Error fetching song:', error);
      res.status(500).json({ message: 'Error fetching song', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}