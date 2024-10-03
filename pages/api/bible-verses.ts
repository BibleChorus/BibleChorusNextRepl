import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { search } = req.query;

  try {
    const query = db('bible_verses')
      .select('book', 'chapter', 'verse')
      .limit(50); // Limit results for performance

    if (search && typeof search === 'string') {
      const trimmedSearch = search.trim(); // Remove leading and trailing spaces
      if (trimmedSearch) {
        query.whereRaw(`CONCAT(book, ' ', chapter, ':', verse) ILIKE ?`, [`%${trimmedSearch}%`]);
      }
    }

    const verses = await query;

    res.status(200).json(verses);
  } catch (error) {
    console.error('Error fetching Bible verses:', error);
    res.status(500).json({ message: 'Error fetching Bible verses' });
  }
}