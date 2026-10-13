import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'node:crypto';
import db from '@/db';
import { ApiError, getAuthenticatedUserId, readId, requireUser } from '@/lib/server-auth';
import { getEntryAccess, listOriginals, lockOwnedEntry, projectOriginal, withOriginalsApiAuth } from '@/lib/journey-originals';
import { createOriginalSchema, ORIGINAL_LIMIT } from '@/lib/journey-originals-validation';
import { originalStorageAvailability, originalUploadKey, requireOriginalStorage, signOriginalUpload } from '@/lib/journey-originals-storage';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method === 'GET') {
    const viewerId = await getAuthenticatedUserId(req, res);
    const originals = await listOriginals(readId(req.query.entryId, 'journey entry ID'), viewerId);
    return res.status(200).json({ originals, storage: await originalStorageAvailability() });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireUser(req, res);
  const parsed = createOriginalSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Provide a label and valid journal text or supported file metadata');
  const data = parsed.data;
  // Check ownership before any storage call, and again under the mutation lock.
  const access = await getEntryAccess(data.entryId);
  if (access.owner_id !== user.id) throw new ApiError(404, 'Journey song entry not found');
  // The digest remains unchanged when a completed original is later edited.
  // An interrupted create response can replay its original intent safely.
  const digest = createHash('sha256').update(JSON.stringify([
    data.entryId, data.kind, data.label, data.journal_text ?? null,
    data.file_name ?? null, data.mime_type ?? null, data.byte_size ?? null,
  ])).digest('hex');
  const prior = await db('journey_originals').where({ owner_id: user.id, request_id: data.requestId }).first();
  if (prior && prior.request_digest !== digest) throw new ApiError(409, 'This creation request was already used for different material');
  const bucket = data.kind === 'journal' || prior ? null : await requireOriginalStorage();
  const record = await db.transaction(async trx => {
    await lockOwnedEntry(data.entryId, user.id, trx);
    const replay = await trx('journey_originals').where({ owner_id: user.id, request_id: data.requestId }).first();
    if (replay) {
      if (replay.request_digest !== digest || Number(replay.journey_entry_id) !== data.entryId) throw new ApiError(409, 'This creation request was already used for different material');
      return replay;
    }
    if (prior) throw new ApiError(409, 'This original was removed. Start a new creation request.');
    const existing = await trx('journey_originals').where({ journey_entry_id: data.entryId }).select('id', 'display_order');
    if (existing.length >= ORIGINAL_LIMIT) throw new ApiError(409, `A song entry can have up to ${ORIGINAL_LIMIT} originals. Remove one before adding another.`);
    const [created] = await trx('journey_originals').insert({
      journey_entry_id: data.entryId, owner_id: user.id, kind: data.kind, label: data.label,
      request_id: data.requestId, request_digest: digest,
      display_order: existing.reduce((max, row) => Math.max(max, Number(row.display_order)), -1) + 1,
      is_shared: false, status: data.kind === 'journal' ? 'ready' : 'pending', journal_text: data.journal_text || null,
      file_name: data.file_name || null, mime_type: data.mime_type || null, byte_size: data.byte_size || null,
      storage_bucket: bucket, upload_key: bucket ? originalUploadKey(user.id) : null, object_key: null,
    }).returning('*');
    return created;
  });
  const original = projectOriginal(record);
  if (record.status === 'ready') return res.status(201).json({ original });
  // A failed signing request leaves a discoverable private reservation for retry.
  try { return res.status(201).json({ original, upload: await signOriginalUpload(record) }); }
  catch { return res.status(201).json({ original, upload_error: 'Upload preparation was interrupted. Retry this original.' }); }
}

export default withOriginalsApiAuth(handler);
