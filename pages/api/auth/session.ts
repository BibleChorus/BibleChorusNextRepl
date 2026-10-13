import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, assertSameOrigin, createSessionToken, requireUser, setSessionCookie } from '@/lib/server-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    assertSameOrigin(req);
    const user = await requireUser(req, res);
    const token = createSessionToken(user.id);
    setSessionCookie(res, token);
    return res.status(200).json({ user, token });
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ message: error.message });
    console.error('Session lookup failed:', error);
    return res.status(500).json({ message: 'Unable to restore session' });
  }
}
