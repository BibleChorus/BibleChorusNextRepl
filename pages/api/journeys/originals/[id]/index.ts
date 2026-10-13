import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { ApiError, getAuthenticatedUserId, readId, requireUser } from '@/lib/server-auth';
import { lockOwnedEntry, ownedOriginal, projectOriginal, readableOriginal, withOriginalsApiAuth } from '@/lib/journey-originals';
import { updateOriginalSchema } from '@/lib/journey-originals-validation';
import { discardOriginalUpload } from '@/lib/journey-originals-storage';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  const id = readId(req.query.id, 'original ID');
  if (req.method === 'GET') return res.status(200).json({ original: projectOriginal(await readableOriginal(id, await getAuthenticatedUserId(req, res))) });
  if (req.method !== 'PATCH' && req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireUser(req, res);
  const found = await ownedOriginal(id, user.id);
  if (req.method === 'DELETE') {
    await db.transaction(async trx => {
      await lockOwnedEntry(found.journey_entry_id, user.id, trx);
      await ownedOriginal(id, user.id, trx);
      await trx('journey_originals').where({ id, owner_id: user.id }).delete();
    });
    await discardOriginalUpload(found);
    return res.status(200).json({ success: true });
  }
  const parsed = updateOriginalSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Provide valid original changes');
  const original = await db.transaction(async trx => {
    await lockOwnedEntry(found.journey_entry_id, user.id, trx);
    const record = await ownedOriginal(id, user.id, trx);
    if (parsed.data.journal_text !== undefined && record.kind !== 'journal') throw new ApiError(400, 'Only journal originals have journal text');
    if (parsed.data.is_shared === true && record.status !== 'ready') throw new ApiError(409, 'Complete the upload before sharing');
    const [updated] = await trx('journey_originals').where({ id, owner_id: user.id }).update({ ...parsed.data, updated_at: trx.fn.now() }).returning('*');
    return projectOriginal(updated);
  });
  return res.status(200).json({ original });
}

export default withOriginalsApiAuth(handler);
