import type { NextApiRequest, NextApiResponse } from 'next';
import { ownedOriginal, projectOriginal, withOriginalsApiAuth } from '@/lib/journey-originals';
import { signOriginalUpload } from '@/lib/journey-originals-storage';
import { readId, requireUser } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireUser(req, res);
  const record = await ownedOriginal(readId(req.query.id, 'original ID'), user.id);
  return res.status(200).json({ original: projectOriginal(record), upload: await signOriginalUpload(record) });
}
export default withOriginalsApiAuth(handler);
