import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { category, value } = req.body as {
    category?: 'quality' | 'theology' | 'helpfulness';
    value?: number;
  };

  if (!category || typeof value !== 'number') {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!['quality', 'theology', 'helpfulness'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  let token = req.cookies.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
    const user_id = decoded.userId;

    const existing = await db('pdf_ratings')
      .where({ pdf_id: id, user_id })
      .first();

    if (existing) {
      await db('pdf_ratings')
        .where({ pdf_id: id, user_id })
        .update({ [category]: value });
    } else {
      await db('pdf_ratings').insert({
        pdf_id: id,
        user_id,
        quality: category === 'quality' ? value : 0,
        theology: category === 'theology' ? value : 0,
        helpfulness: category === 'helpfulness' ? value : 0,
      });
    }

    const sumResult = await db('pdf_ratings')
      .where('pdf_id', id)
      .sum(`${category} as count`);

    const count = Number(sumResult[0]?.count ?? 0);

    res.status(200).json({ message: 'Vote submitted successfully', count });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ message: 'Error submitting vote' });
  }
}
