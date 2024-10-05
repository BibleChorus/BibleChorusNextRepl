import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { book, chapter } = req.query;

  if (!book || !chapter) {
    return res.status(400).json({ message: 'Book and chapter are required' });
  }

  try {
    const verses = await db('bible_verses')
      .select('book', 'chapter', 'verse')
      .where({ book, chapter })
      .orderBy('verse');

    res.status(200).json(verses);
  } catch (error) {
    console.error('Error fetching Bible verses:', error);
    res.status(500).json({ message: 'Error fetching Bible verses' });
  }
}