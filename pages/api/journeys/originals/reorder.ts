import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { listOriginals, lockOwnedEntry, withOriginalsApiAuth } from '@/lib/journey-originals';
import { reorderOriginalsSchema } from '@/lib/journey-originals-validation';
import { ApiError, requireUser } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireUser(req, res);
  const parsed = reorderOriginalsSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Provide an entry and ordered original IDs');
  const { entryId, originalIds } = parsed.data;
  const originals = await db.transaction(async trx => {
    await lockOwnedEntry(entryId, user.id, trx);
    const current = await trx('journey_originals').where({ journey_entry_id: entryId }).select('id');
    if (new Set(originalIds).size !== originalIds.length || current.length !== originalIds.length || current.some(row => !originalIds.includes(Number(row.id)))) throw new ApiError(409, 'The originals changed. Refresh before reordering.');
    for (const [display_order, id] of originalIds.entries()) await trx('journey_originals').where({ id, journey_entry_id: entryId, owner_id: user.id }).update({ display_order, updated_at: trx.fn.now() });
    return listOriginals(entryId, user.id, trx);
  });
  return res.status(200).json({ originals });
}
export default withOriginalsApiAuth(handler);
