import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_id, category, value } = req.body as {
    user_id?: number;
    category?: 'quality' | 'theology' | 'helpfulness';
    value?: number;
  };

  if (!user_id || !category || typeof value !== 'number') {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!['quality', 'theology', 'helpfulness'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  try {
    const existing = await db('pdf_ratings')
      .where({ pdf_id: id, user_id })
      .first();

    if (existing) {
      await db('pdf_ratings')
        .where({ pdf_id: id, user_id })
        .update({ [category]: existing[category] + value });
    } else {
      await db('pdf_ratings').insert({
        pdf_id: id,
        user_id,
        quality: category === 'quality' ? value : 0,
        theology: category === 'theology' ? value : 0,
        helpfulness: category === 'helpfulness' ? value : 0,
      });
    }

    const [{ count }] = await db('pdf_ratings')
      .where('pdf_id', id)
      .sum(`${category} as count`);

    res.status(200).json({ message: 'Vote submitted successfully', count: Number(count) });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ message: 'Error submitting vote' });
  }
}
