import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { requireUser, withApiAuth } from '@/lib/server-auth';
import { requireReadablePdf } from '@/lib/resource-access';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { category, value } = req.body as {
    category?: 'quality' | 'theology' | 'helpfulness';
    value?: number;
  };

  if (!category || ![-1, 0, 1].includes(value as number)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!['quality', 'theology', 'helpfulness'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  const user = await requireUser(req, res);
  await requireReadablePdf(Number(id), user);

  try {
    const user_id = user.id;

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


export default withApiAuth(handler, { methods: ['POST'] });
