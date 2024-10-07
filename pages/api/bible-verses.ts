import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { book, chapter, search } = req.query;

  if (search && typeof search === 'string' && search.trim() !== '') {
    // Handle search functionality (used by [id].tsx)
    try {
      const verses = await db('bible_verses')
        .select('book', 'chapter', 'verse')
        .whereRaw(
          `CONCAT(book, ' ', chapter, ':', verse) ILIKE ?`,
          [`%${search}%`]
        )
        .orderBy(['book', 'chapter', 'verse']);

      res.status(200).json(verses);
    } catch (error) {
      console.error('Error fetching Bible verses with search:', error);
      res.status(500).json({ message: 'Error fetching Bible verses' });
    }
  } else if (book && chapter) {
    // Handle fetching verses by book and chapter (used by upload.tsx)
    try {
      const verses = await db('bible_verses')
        .select('book', 'chapter', 'verse', 'KJV_text')
        .where({ book, chapter })
        .orderBy('verse');

      res.status(200).json(verses);
    } catch (error) {
      console.error('Error fetching Bible verses by book and chapter:', error);
      res.status(500).json({ message: 'Error fetching Bible verses' });
    }
  } else {
    // If neither search nor book and chapter are provided
    return res.status(400).json({ message: 'Invalid query parameters' });
  }
}