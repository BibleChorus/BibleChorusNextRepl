import {
  CopyObjectCommand, DeleteObjectCommand, GetBucketOwnershipControlsCommand, GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand, GetObjectCommand, GetPublicAccessBlockCommand, HeadObjectCommand, PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import s3Client from '@/lib/s3';
import { ApiError } from '@/lib/server-auth';
import { matchesOriginalSignature, validOriginalFile } from '@/lib/journey-originals-validation';
import type { JourneyOriginalUpload } from '@/types/journey';
import type { OriginalRecord } from '@/lib/journey-originals';

const unavailable = 'Private file storage has not been verified. Journal originals are available.';

export function originalStorageConfigured(): boolean {
  const bucket = process.env.JOURNEY_ORIGINALS_BUCKET;
  const publicBucket = process.env.AWS_S3_BUCKET_NAME;
  return process.env.JOURNEY_ORIGINALS_STORAGE_VERIFIED === 'true' && !!bucket && /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) && !!publicBucket && bucket !== publicBucket;
}

/** No credentials/policies are created here. Missing read permissions fail closed. */
export async function requireOriginalStorage(expectedBucket?: string): Promise<string> {
  const bucket = process.env.JOURNEY_ORIGINALS_BUCKET;
  if (!originalStorageConfigured() || !bucket || (expectedBucket && bucket !== expectedBucket)) throw new ApiError(503, unavailable);
  try {
    const [block, status, ownership, policy] = await Promise.all([
      s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucket })),
      s3Client.send(new GetBucketPolicyStatusCommand({ Bucket: bucket })).catch(error => {
        if (error?.name === 'NoSuchBucketPolicy') return { PolicyStatus: { IsPublic: false } };
        throw error;
      }),
      s3Client.send(new GetBucketOwnershipControlsCommand({ Bucket: bucket })),
      s3Client.send(new GetBucketPolicyCommand({ Bucket: bucket })).catch(error => {
        if (error?.name === 'NoSuchBucketPolicy') return { Policy: undefined };
        throw error;
      }),
    ]);
    const controls = block.PublicAccessBlockConfiguration;
    if (!controls?.BlockPublicAcls || !controls.IgnorePublicAcls || !controls.BlockPublicPolicy || !controls.RestrictPublicBuckets || status.PolicyStatus?.IsPublic !== false || !ownership.OwnershipControls?.Rules?.some(rule => rule.ObjectOwnership === 'BucketOwnerEnforced')) throw new Error();
    // Even a nonpublic bucket policy can grant CloudFront/OAC or other principals
    // access outside this API. Use existing identity-based app permissions only.
    if (policy.Policy) {
      const parsed = JSON.parse(policy.Policy);
      const statements = Array.isArray(parsed.Statement) ? parsed.Statement : [parsed.Statement];
      if (!statements.length || statements.some((statement: any) => !statement || statement.Effect !== 'Deny')) throw new Error();
    }
    return bucket;
  } catch {
    throw new ApiError(503, unavailable);
  }
}

export async function originalStorageAvailability() {
  try { await requireOriginalStorage(); return { enabled: true }; }
  catch { return { enabled: false, message: unavailable }; }
}

export function originalUploadKey(ownerId: number) {
  return `journey-originals/pending/${ownerId}/${randomUUID()}`;
}

export async function signOriginalUpload(record: OriginalRecord): Promise<JourneyOriginalUpload> {
  if (record.status !== 'pending' || !record.upload_key || !record.mime_type || !record.byte_size) throw new ApiError(409, 'This original is already complete');
  const bucket = await requireOriginalStorage(record.storage_bucket || undefined);
  const command = new PutObjectCommand({ Bucket: bucket, Key: record.upload_key, ContentType: record.mime_type, ContentLength: Number(record.byte_size) });
  try {
    const url = await getSignedUrl(s3Client as any, command, { expiresIn: 900, signableHeaders: new Set(['content-type']) });
    return { url, headers: { 'Content-Type': record.mime_type }, expires_in: 900 };
  } catch { throw new ApiError(503, 'Unable to prepare the private upload. Try again.'); }
}

export async function finalizeOriginalFile(record: OriginalRecord): Promise<string> {
  const bucket = await requireOriginalStorage(record.storage_bucket || undefined);
  if (record.kind === 'journal' || !record.upload_key || !record.mime_type || !record.byte_size) throw new ApiError(400, 'Invalid file original');
  try {
    const head = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: record.upload_key }));
    if (!head.ETag || head.ContentLength !== Number(record.byte_size) || head.ContentType !== record.mime_type || !validOriginalFile(record.kind, head.ContentType, head.ContentLength)) throw new Error();
    const prefix = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: record.upload_key, Range: `bytes=0-${Math.min(511, head.ContentLength - 1)}`, IfMatch: head.ETag }));
    if (!prefix.Body) throw new Error();
    const bytes = await prefix.Body.transformToByteArray();
    if (!matchesOriginalSignature(record.mime_type, bytes)) throw new Error();
    const finalKey = `journey-originals/ready/${record.owner_id}/${randomUUID()}`;
    const source = `${bucket}/${record.upload_key}`.split('/').map(encodeURIComponent).join('/');
    await s3Client.send(new CopyObjectCommand({ Bucket: bucket, Key: finalKey, CopySource: source, CopySourceIfMatch: head.ETag, MetadataDirective: 'REPLACE', ContentType: record.mime_type, CacheControl: 'no-store' }));
    return finalKey;
  } catch { throw new ApiError(400, 'The uploaded file is incomplete or does not match its declared size and type. Select the same file and retry.'); }
}

/** Cleanup is best effort; unreachable orphan objects are safer than deleting saved files. */
export async function discardOriginalUpload(record: OriginalRecord) {
  if (!record.storage_bucket || !record.upload_key || !originalStorageConfigured() || record.storage_bucket !== process.env.JOURNEY_ORIGINALS_BUCKET) return;
  try { await s3Client.send(new DeleteObjectCommand({ Bucket: record.storage_bucket, Key: record.upload_key })); } catch {}
}

export function originalRange(value: unknown, size: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new ApiError(416, 'Invalid byte range');
  // Ignore unknown range units; standardized units are case insensitive.
  if (value.split('=', 1)[0].toLowerCase() !== 'bytes') return undefined;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value);
  if (!match || (!match[1] && !match[2])) throw new ApiError(416, 'Invalid byte range');
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) throw new ApiError(416, 'Invalid byte range');
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) throw new ApiError(416, 'Invalid byte range');
  return `bytes=${start}-${end}`;
}
