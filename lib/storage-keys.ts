import db from '@/db';
import { ApiError } from '@/lib/server-auth';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3';

function storageBases() {
  return [...new Set([process.env.CDN_URL, process.env.NEXT_PUBLIC_CDN_URL, process.env.CLOUDFRONT_URL].filter(Boolean))] as string[];
}

/** Accept existing raw keys, leading-slash keys, and configured CDN URLs. */
export function storageKey(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, 'File key is required');
  let key = value.trim();
  if (/^https?:\/\//i.test(key)) {
    const url = new URL(key);
    const base = storageBases().find(candidate => {
      try { const parsed = new URL(candidate); return parsed.origin === url.origin && url.pathname.startsWith(parsed.pathname.replace(/\/$/, '') + '/'); }
      catch { return false; }
    });
    if (!base || url.search || url.hash) throw new ApiError(400, 'File URL must use the configured storage service');
    const basePath = new URL(base).pathname.replace(/\/$/, '');
    key = url.pathname.slice(basePath.length);
  }
  try { key = decodeURIComponent(key).replace(/^\/+/, ''); }
  catch { throw new ApiError(400, 'Invalid file key'); }
  if (!key || /[\\\u0000-\u001f?#]/.test(key) || key.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new ApiError(400, 'Invalid file key');
  }
  return key;
}

export function ownedStorageKey(value: unknown, userId: number): string {
  const key = storageKey(value);
  if (!key.startsWith(`uploads/${userId}/`)) throw new ApiError(403, 'You can only manage your own uploaded files');
  return key;
}

export function storageUrl(value: unknown): string {
  const key = storageKey(value);
  const base = process.env.CDN_URL || process.env.NEXT_PUBLIC_CDN_URL || '';
  return base ? `${base.replace(/\/+$/, '')}/${key}` : key;
}

/** Check the stored object, rather than trusting a declared browser size or MIME. */
export async function assertUploadedFile(key: string, kind: 'audio' | 'image' | 'pdf') {
  try {
    const object = await s3Client.send(new HeadObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
    const limit = (kind === 'audio' ? 200 : kind === 'image' ? 5 : 10) * 1024 * 1024;
    const type = object.ContentType || '';
    const validType = kind === 'pdf' ? type === 'application/pdf' : type.startsWith(`${kind}/`);
    if (!validType || !object.ContentLength || object.ContentLength > limit) throw new Error('Invalid object');
  } catch {
    throw new ApiError(400, 'Upload a valid file within the size limit before submitting');
  }
}

const REFERENCES: [string, string[]][] = [
  ['songs', ['audio_url', 'song_art_url']],
  ['pdfs', ['file_url', 'image_url']],
  ['playlists', ['cover_art_url']],
  ['users', ['profile_image_url']],
  ['journey_profiles', ['cover_image_url']],
  ['seasons', ['cover_image_url']],
  ['journey_season_songs', ['source_url']],
  ['journey_season_important_dates', ['photo_url']],
];

export async function assertUnreferencedFile(key: string, query = db) {
  const values = new Set([key, `/${key}`]);
  for (const base of storageBases()) {
    values.add(`${base}${key}`); // Preserve historical URLs created without joining slashes.
    values.add(`${base.replace(/\/+$/, '')}/${key}`);
    values.add(`${base.replace(/\/+$/, '')}/${encodeURI(key)}`);
  }
  for (const [table, columns] of REFERENCES) {
    const record = await query(table).where(function() {
      for (const column of columns) this.orWhereIn(column, [...values]);
    }).first('id');
    if (record) throw new ApiError(409, 'This file is still used by saved content');
  }
}
