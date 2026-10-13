import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { ApiError, assertSameOrigin, createSessionToken, publicUser, setSessionCookie } from '@/lib/server-auth';

const credentials = z.object({ email: z.string().trim().email().max(100), password: z.string().min(1).max(200) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  try {
    assertSameOrigin(req);
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password' });
    const { email, password } = parsed.data;
    const user = await db('users').whereRaw('LOWER(email) = ?', [email.toLowerCase()]).first();
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = createSessionToken(user.id);
    setSessionCookie(res, token);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ user: publicUser(user), token });
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ message: error.message });
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Unable to sign in. Please try again.' });
  }
}
