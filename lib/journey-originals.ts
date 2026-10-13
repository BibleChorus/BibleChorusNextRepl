import db from '@/db';
import { ApiError, withApiAuth } from '@/lib/server-auth';
import type { NextApiHandler } from 'next';
import type { JourneyOriginal, JourneyOriginalKind } from '@/types/journey';

export interface OriginalRecord {
  id: number; journey_entry_id: number; owner_id: number; kind: JourneyOriginalKind;
  request_id: string; request_digest: string;
  label: string; display_order: number; is_shared: boolean; status: 'pending' | 'ready';
  journal_text: string | null; file_name: string | null; mime_type: string | null; byte_size: number | null;
  storage_bucket: string | null; upload_key: string | null; object_key: string | null; created_at: string; updated_at: string;
}

export interface OriginalAccess { owner_id: number; is_public: boolean; is_visible: boolean }

/** Database exceptions may contain journal bindings; keep private details out of logs. */
export function withOriginalsApiAuth(handler: NextApiHandler): NextApiHandler {
  return withApiAuth(async (req, res) => {
    try { await handler(req, res); }
    catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Unable to complete the original request');
    }
  });
}

export function canReadOriginal(record: OriginalRecord, access: OriginalAccess, viewerId: number | null): boolean {
  return Number(record.owner_id) === Number(access.owner_id) && (viewerId === Number(access.owner_id) || (record.status === 'ready' && record.is_shared === true && access.is_public === true && access.is_visible === true));
}

export function projectOriginal(record: OriginalRecord, includeJournal = true): JourneyOriginal {
  return {
    id: Number(record.id), journey_entry_id: Number(record.journey_entry_id), kind: record.kind, label: record.label,
    display_order: record.display_order, is_shared: record.is_shared, status: record.status, journal_text: includeJournal ? record.journal_text : null,
    file_name: record.file_name, mime_type: record.mime_type, byte_size: record.byte_size === null ? null : Number(record.byte_size),
    file_url: record.status === 'ready' && record.kind !== 'journal' ? `/api/journeys/originals/${record.id}/file` : null,
    created_at: record.created_at, updated_at: record.updated_at,
  };
}

export async function getEntryAccess(entryId: number, query = db): Promise<OriginalAccess> {
  const entry = await query('journey_season_songs').where({ id: entryId }).first();
  if (!entry) throw new ApiError(404, 'Journey song entry not found');
  const season = await query('seasons').where({ id: entry.season_id }).first();
  if (!season) throw new ApiError(404, 'Journey song entry not found');
  const profile = await query('journey_profiles').where({ user_id: season.user_id }).first();
  if (!profile) throw new ApiError(404, 'Journey not found');
  return { owner_id: Number(season.user_id), is_public: profile.is_public === true, is_visible: season.is_visible === true };
}

/** Serialize every originals mutation on its parent entry, including create and reorder. */
export async function lockOwnedEntry(entryId: number, ownerId: number, query: typeof db) {
  const entry = await query('journey_season_songs').where({ id: entryId }).forUpdate().first();
  if (!entry) throw new ApiError(404, 'Journey song entry not found');
  const access = await getEntryAccess(entryId, query);
  if (access.owner_id !== ownerId) throw new ApiError(404, 'Journey song entry not found');
  return access;
}

export async function readableOriginal(id: number, viewerId: number | null) {
  const record: OriginalRecord | undefined = await db('journey_originals').where({ id }).first();
  if (!record) throw new ApiError(404, 'Original not found');
  const access = await getEntryAccess(record.journey_entry_id);
  if (!canReadOriginal(record, access, viewerId)) throw new ApiError(404, 'Original not found');
  return record;
}

export async function ownedOriginal(id: number, ownerId: number, query = db): Promise<OriginalRecord> {
  const record = await query('journey_originals').where({ id, owner_id: ownerId }).first();
  if (!record) throw new ApiError(404, 'Original not found');
  const access = await getEntryAccess(record.journey_entry_id, query);
  if (access.owner_id !== ownerId) throw new ApiError(404, 'Original not found');
  return record;
}

export async function listOriginals(entryId: number, viewerId: number | null, query = db, includeJournal = false): Promise<JourneyOriginal[]> {
  const access = await getEntryAccess(entryId, query);
  if (access.owner_id !== viewerId && (!access.is_public || !access.is_visible)) throw new ApiError(404, 'Journey song entry not found');
  const rows: OriginalRecord[] = await query('journey_originals').where({ journey_entry_id: entryId }).select(
    'id', 'journey_entry_id', 'owner_id', 'kind', 'label', 'display_order', 'is_shared', 'status',
    'file_name', 'mime_type', 'byte_size', 'created_at', 'updated_at', ...(includeJournal ? ['journal_text'] : []),
  ).orderBy('display_order', 'asc').orderBy('id', 'asc');
  return rows.filter(record => canReadOriginal(record, access, viewerId)).map(record => projectOriginal(record, includeJournal));
}
