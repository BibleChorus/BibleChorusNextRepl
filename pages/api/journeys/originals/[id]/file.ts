import type { NextApiRequest, NextApiResponse } from 'next';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import s3Client from '@/lib/s3';
import { readableOriginal, withOriginalsApiAuth } from '@/lib/journey-originals';
import { originalRange, requireOriginalStorage } from '@/lib/journey-originals-storage';
import { ApiError, getAuthenticatedUserId, readId } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Cookie, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ error: 'Method not allowed' });
  const record = await readableOriginal(readId(req.query.id, 'original ID'), await getAuthenticatedUserId(req, res));
  if (record.status !== 'ready' || record.kind === 'journal' || !record.object_key || !record.mime_type || !record.byte_size) throw new ApiError(404, 'File original not found');
  // CSP sandbox disables native PDF viewers. Strict validated PDF MIME + nosniff
  // keeps the protected response out of the HTML execution path.
  if (record.kind === 'pdf') res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; frame-ancestors 'self'");
  const bucket = await requireOriginalStorage(record.storage_bucket || undefined);
  let range: string | undefined;
  // RFC 9110: Range only changes GET responses; HEAD returns full metadata.
  try { range = req.method === 'GET' ? originalRange(req.headers.range, Number(record.byte_size)) : undefined; }
  catch (error) { res.setHeader('Content-Range', `bytes */${record.byte_size}`); throw error; }
  const abort = new AbortController();
  const disconnect = () => { if (!res.writableEnded) abort.abort(); };
  req.once('aborted', disconnect); res.once('close', disconnect);
  try {
    const input = { Bucket: bucket, Key: record.object_key, ...(range ? { Range: range } : {}) };
    const object = req.method === 'HEAD'
      ? await s3Client.send(new HeadObjectCommand(input), { abortSignal: abort.signal })
      : await s3Client.send(new GetObjectCommand(input), { abortSignal: abort.signal });
    res.setHeader('Content-Type', record.mime_type);
    res.setHeader('Accept-Ranges', 'bytes');
    const filename = encodeURIComponent(record.file_name || record.label).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    res.setHeader('Content-Disposition', `${req.query.download === '1' ? 'attachment' : 'inline'}; filename*=UTF-8''${filename}`);
    if (range) {
      const [start, end] = range.slice(6).split('-').map(Number);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${record.byte_size}`);
      res.setHeader('Content-Length', end - start + 1);
    } else if (object.ContentLength !== undefined) res.setHeader('Content-Length', object.ContentLength);
    res.status(range ? 206 : 200);
    if (req.method === 'HEAD') return res.end();
    const body = 'Body' in object ? object.Body : undefined;
    if (!body) throw new Error();
    await pipeline(body as Readable, res);
  } catch {
    if (res.headersSent) { if (!res.writableEnded) res.destroy(); return; }
    throw new ApiError(503, 'The private file is temporarily unavailable. Try again.');
  } finally { req.off('aborted', disconnect); res.off('close', disconnect); }
}

export const config = { api: { responseLimit: false } };
export default withOriginalsApiAuth(handler);
