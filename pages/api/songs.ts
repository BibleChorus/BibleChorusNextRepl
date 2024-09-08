import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const songs = await db('songs').select('*');
        res.status(200).json(songs);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching songs', error });
      }
      break;

    case 'POST':
      try {
        const [id] = await db('songs').insert(req.body).returning('id');
        res.status(201).json({ id });
      } catch (error) {
        res.status(500).json({ message: 'Error creating song', error });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}