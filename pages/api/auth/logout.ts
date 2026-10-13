import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, assertSameOrigin, setSessionCookie } from '@/lib/server-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  try {
    assertSameOrigin(req);
    setSessionCookie(res, null);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ message: 'Signed out' });
  } catch (error) {
    return res.status(error instanceof ApiError ? error.status : 500).json({ message: 'Unable to sign out' });
  }
}
