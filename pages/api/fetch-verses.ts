import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const versesToFetch = req.body;

  try {
    const fetchedVerses = await Promise.all(
      versesToFetch.map(async (verseInfo: { translation: string; book: number; chapter: number; verses: number[] }) => {
        const { translation, book, chapter, verses } = verseInfo;

        try {
          const response = await axios.post(
            'https://bolls.life/get-verses/',
            [{
              translation,
              book,
              chapter,
              verses
            }]
          );
          return response.data[0]; // The API returns an array of arrays, we only sent one request so we take the first array
        } catch (error) {
          console.error(`Error fetching verses for ${translation} ${book}:${chapter}:${verses.join(',')}`, error);
          return [];
        }
      })
    );

    res.status(200).json(fetchedVerses);
  } catch (error) {
    console.error('Error fetching verses from Bolls Life API:', error);
    res.status(500).json({ message: 'Error fetching verses' });
  }
}