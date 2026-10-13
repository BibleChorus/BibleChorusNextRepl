import { z } from 'zod';
import type { JourneyOriginalKind } from '@/types/journey';

export const ORIGINAL_LIMIT = 20;
export const ORIGINAL_LABEL_LIMIT = 120;
export const ORIGINAL_JOURNAL_LIMIT = 50000;
export const ORIGINAL_FILE_TYPES = {
  audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/flac'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  pdf: ['application/pdf'],
} as const;
export const ORIGINAL_FILE_LIMITS = { audio: 200 * 1024 * 1024, image: 5 * 1024 * 1024, pdf: 10 * 1024 * 1024 };
const label = z.string().trim().min(1).max(ORIGINAL_LABEL_LIMIT);
const fileName = z.string().trim().min(1).max(255).refine(value => !/[\u0000-\u001f\u007f/\\]/.test(value), 'Invalid file name');
export const createOriginalSchema = z.object({
  requestId: z.string().uuid(), entryId: z.number().int().positive(), kind: z.enum(['audio', 'journal', 'image', 'pdf']), label,
  journal_text: z.string().trim().min(1).max(ORIGINAL_JOURNAL_LIMIT).optional(),
  file_name: fileName.optional(), mime_type: z.string().max(100).optional(), byte_size: z.number().int().positive().optional(),
}).strict().superRefine((data, ctx) => {
  if (data.kind === 'journal') {
    if (!data.journal_text || data.file_name || data.mime_type || data.byte_size) ctx.addIssue({ code: 'custom', message: 'Provide journal text without file metadata' });
  } else if (!data.file_name || !data.mime_type || !data.byte_size || !validOriginalFile(data.kind, data.mime_type, data.byte_size)) {
    ctx.addIssue({ code: 'custom', message: 'Provide a supported file within the size limit' });
  } else if (data.journal_text !== undefined) ctx.addIssue({ code: 'custom', message: 'File originals cannot contain journal text' });
});
export const updateOriginalSchema = z.object({
  label: label.optional(), journal_text: z.string().trim().min(1).max(ORIGINAL_JOURNAL_LIMIT).optional(), is_shared: z.boolean().optional(),
}).strict().refine(data => Object.keys(data).length > 0, 'Provide a change');
export const reorderOriginalsSchema = z.object({ entryId: z.number().int().positive(), originalIds: z.array(z.number().int().positive()).max(ORIGINAL_LIMIT) }).strict();
export function validOriginalFile(kind: JourneyOriginalKind, mime: string, size: number): boolean {
  return kind !== 'journal' && (ORIGINAL_FILE_TYPES[kind] as readonly string[]).includes(mime) && Number.isSafeInteger(size) && size > 0 && size <= ORIGINAL_FILE_LIMITS[kind];
}

/** Reject executable SVG/HTML and verify the declared format's signature, not its suffix. */
export function matchesOriginalSignature(mime: string, bytes: Uint8Array): boolean {
  const b = Buffer.from(bytes);
  const text = (start: number, end: number) => b.subarray(start, end).toString('ascii');
  switch (mime) {
    case 'application/pdf': return text(0, 5) === '%PDF-';
    case 'image/jpeg': return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'image/png': return b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case 'image/webp': return text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP';
    case 'audio/mpeg': return text(0, 3) === 'ID3' || (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    case 'audio/wav': case 'audio/x-wav': return text(0, 4) === 'RIFF' && text(8, 12) === 'WAVE';
    case 'audio/ogg': return text(0, 4) === 'OggS';
    case 'audio/flac': return text(0, 4) === 'fLaC';
    case 'audio/mp4': case 'audio/x-m4a': return text(4, 8) === 'ftyp' && b.length >= 12;
    default: return false;
  }
}
