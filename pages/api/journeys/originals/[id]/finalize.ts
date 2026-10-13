import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { lockOwnedEntry, ownedOriginal, projectOriginal, withOriginalsApiAuth } from '@/lib/journey-originals';
import { discardOriginalUpload, finalizeOriginalFile } from '@/lib/journey-originals-storage';
import { readId, requireUser } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireUser(req, res);
  const id = readId(req.query.id, 'original ID');
  const found = await ownedOriginal(id, user.id);
  const original = await db.transaction(async trx => {
    await lockOwnedEntry(found.journey_entry_id, user.id, trx);
    const record = await ownedOriginal(id, user.id, trx);
    if (record.status === 'ready') return projectOriginal(record); // Idempotent after an interrupted response.
    const key = await finalizeOriginalFile(record);
    const [updated] = await trx('journey_originals').where({ id, owner_id: user.id }).update({ object_key: key, status: 'ready', is_shared: false, updated_at: trx.fn.now() }).returning('*');
    return projectOriginal(updated);
  });
  await discardOriginalUpload(found);
  return res.status(200).json({ original });
}
export default withOriginalsApiAuth(handler);
