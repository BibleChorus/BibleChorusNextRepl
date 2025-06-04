import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (req.method === 'GET') {
    const teaching = await db('teachings').where({ id }).first();
    if (!teaching) return res.status(404).end('Not found');
    const verses = await db('teaching_verses')
      .join('bible_verses', 'teaching_verses.verse_id', 'bible_verses.id')
      .where('teaching_verses.teaching_id', id)
      .select('bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse');
    res.status(200).json({ ...teaching, verses });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
