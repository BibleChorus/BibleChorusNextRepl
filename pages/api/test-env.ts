import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser, withApiAuth } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  if (!user.is_admin) return res.status(403).json({ message: 'Administrator access required' });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ jwtSecretSet: !!process.env.JWT_SECRET, nodeEnv: process.env.NODE_ENV });
}

export default withApiAuth(handler, { methods: ['GET'] });
