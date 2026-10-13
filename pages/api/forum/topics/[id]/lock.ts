import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { ApiError, readId, requireUser, withApiAuth } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  if (!user.is_admin && !user.is_moderator) throw new ApiError(403, 'Moderator access required');
  const id = readId(req.query.id, 'topic ID');
  const [topic] = await db('forum_topics').where({ id }).update({ is_locked: true }).returning('*');
  if (!topic) throw new ApiError(404, 'Topic not found');
  return res.status(200).json(topic);
}

export default withApiAuth(handler, { methods: ['PATCH'] });
