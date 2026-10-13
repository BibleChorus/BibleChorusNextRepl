import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import db from '@/db';
import { getJwtSecret } from '@/lib/jwt';
import type { User } from '@/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type AuthenticatedRequest = NextApiRequest & { authUser?: User };
const SESSION_SECONDS = 24 * 60 * 60;

/** Preserve legacy bearer tokens while giving browser requests an HttpOnly session. */
export function setSessionCookie(res: NextApiResponse, token: string | null) {
  const cookie = serialize('token', token || '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: token ? SESSION_SECONDS : 0,
  });
  const existing = typeof res.getHeader === 'function' ? res.getHeader('Set-Cookie') : undefined;
  const cookies = (Array.isArray(existing) ? existing : existing ? [String(existing)] : []).filter(value => !value.startsWith('token='));
  res.setHeader('Set-Cookie', cookies.length ? [...cookies, cookie] : cookie);
}

export function createSessionToken(userId: number) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: SESSION_SECONDS });
}

export function publicUser(record: Record<string, any>): User {
  const { password_hash, ...user } = record;
  return user as User;
}

export async function getAuthenticatedUser(req: AuthenticatedRequest, res?: NextApiResponse): Promise<User | null> {
  if (req.authUser) return req.authUser;
  const header = req.headers.authorization;
  const bearer = typeof header === 'string' && /^Bearer\s+/i.test(header) ? header.replace(/^Bearer\s+/i, '') : null;
  const token = bearer || req.cookies?.token;
  let userId: number | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
      if (typeof decoded === 'object' && Number.isSafeInteger(Number(decoded.userId)) && Number(decoded.userId) > 0) {
        userId = Number(decoded.userId);
      }
    } catch {
      // An explicitly supplied invalid bearer token must never become another user's session.
      if (bearer) return null;
    }
  }

  if (!userId && res && Object.keys(req.cookies || {}).some(name => name.includes('session-token'))) {
    try {
      const { auth } = await import('@/auth');
      const session = await (auth as any)(req, res);
      const id = Number(session?.user?.id);
      if (Number.isSafeInteger(id) && id > 0) userId = id;
    } catch {
      return null;
    }
  }

  if (!userId) return null;
  const record = await db('users').where({ id: userId }).first();
  if (!record) return null;
  req.authUser = publicUser(record);
  return req.authUser;
}

export async function getAuthenticatedUserId(req: NextApiRequest, res?: NextApiResponse): Promise<number | null> {
  return (await getAuthenticatedUser(req, res))?.id ?? null;
}

export function assertSameOrigin(req: NextApiRequest) {
  const origin = req.headers.origin;
  if (!origin) return; // Native/API clients do not send an Origin header.
  const allowedHosts = [req.headers.host];
  for (const url of [process.env.NEXT_PUBLIC_BASE_URL, process.env.NEXTAUTH_URL]) {
    if (url) { try { allowedHosts.push(new URL(url).host); } catch {} }
  }
  try {
    if (!allowedHosts.includes(new URL(origin).host)) throw new Error();
  } catch {
    throw new ApiError(403, 'Request origin is not allowed');
  }
}

export async function requireUser(req: NextApiRequest, res: NextApiResponse): Promise<User> {
  const user = await getAuthenticatedUser(req, res);
  if (!user) throw new ApiError(401, 'Authentication required');
  return user;
}

export function readId(value: unknown, label = 'ID'): number {
  const id = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, `Invalid ${label}`);
  return id;
}

type OwnerResource = 'songs' | 'pdfs' | 'playlists' | 'users';
interface AuthPolicy {
  methods?: string[];
  owner?: OwnerResource;
  /** Derive these legacy payload properties from the verified session. */
  identityFields?: string[];
}

export async function requireResourceOwner(req: NextApiRequest, user: User, resource: OwnerResource) {
  const id = readId(req.query.id);
  const record = await db(resource).where({ id }).first();
  if (!record) throw new ApiError(404, 'Resource not found');
  const owner = resource === 'users' ? record.id : resource === 'playlists' ? record.user_id : record.uploaded_by;
  if (Number(owner) !== user.id) throw new ApiError(403, 'You can only change your own content');
  return record;
}

/** A single boundary for legacy API mutations, without changing their response contracts. */
export function withApiAuth(handler: NextApiHandler, policy: AuthPolicy = {}): NextApiHandler {
  return async (req: AuthenticatedRequest, res) => {
    try {
      const guarded = policy.methods ? policy.methods.includes(req.method || '') : !['GET', 'HEAD', 'OPTIONS'].includes(req.method || '');
      if (guarded) {
        assertSameOrigin(req);
        const user = await requireUser(req, res);
        if (policy.owner) await requireResourceOwner(req, user, policy.owner);
        if (typeof req.body === 'string' && req.body) {
          try { req.body = JSON.parse(req.body); } catch { throw new ApiError(400, 'Invalid request body'); }
        }
        if (policy.identityFields?.length) {
          if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new ApiError(400, 'Invalid request body');
          for (const field of policy.identityFields) req.body[field] = user.id;
        }
      }
      await handler(req, res);
    } catch (error) {
      if (res.headersSent) return;
      if (error instanceof ApiError) return res.status(error.status).json({ message: error.message, error: error.message });
      console.error('API request failed:', error);
      return res.status(500).json({ message: 'Unable to complete request' });
    }
  };
}
