import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { auth } from '@/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await auth(req, res);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id);
  const { seasonOrders } = req.body;

  if (!Array.isArray(seasonOrders)) {
    return res.status(400).json({ error: 'seasonOrders must be an array' });
  }

  try {
    await db.transaction(async (trx) => {
      for (const { id, display_order } of seasonOrders) {
        await trx('seasons')
          .where({ id, user_id: userId })
          .update({ display_order });
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error reordering seasons:', error);
    return res.status(500).json({ error: 'Failed to reorder seasons' });
  }
}
