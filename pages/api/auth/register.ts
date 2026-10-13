import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { ApiError, assertSameOrigin, createSessionToken, publicUser, setSessionCookie } from '@/lib/server-auth';

const registration = z.object({
  username: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(100).transform(value => value.toLowerCase()),
  password: z.string().min(8).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  try {
    assertSameOrigin(req);
    const parsed = registration.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.path[0] === 'password' ? 'Use a password of at least 8 characters and at most 72 bytes' : 'Enter a username and valid email' });
    const { username, email, password } = parsed.data;
    const existing = await db('users').whereRaw('LOWER(email) = ?', [email]).orWhere({ username }).first();
    if (existing) return res.status(409).json({ message: 'That email or username is already in use' });
    const [user] = await db('users').insert({ username, email, password_hash: await bcrypt.hash(password, 10) }).returning('*');
    const token = createSessionToken(user.id);
    setSessionCookie(res, token);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ user: publicUser(user), token });
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ message: error.message });
    if ((error as { code?: string }).code === '23505') return res.status(409).json({ message: 'That email or username is already in use' });
    console.error('Registration failed:', error);
    return res.status(500).json({ message: 'Unable to create your account. Please try again.' });
  }
}
