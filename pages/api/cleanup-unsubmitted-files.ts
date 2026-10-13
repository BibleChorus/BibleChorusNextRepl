import type { NextApiRequest, NextApiResponse } from 'next';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3';
import { ApiError, requireUser, withApiAuth } from '@/lib/server-auth';
import { assertUnreferencedFile, ownedStorageKey } from '@/lib/storage-keys';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const values = req.body?.fileKeys;
  if (!Array.isArray(values) || values.length > 50) throw new ApiError(400, 'Provide an array of at most 50 file keys');
  const keys = [...new Set(values.map(value => ownedStorageKey(value, user.id)))];
  // Validate the complete batch before touching storage. A stale unload beacon must
  // never delete a file that was just committed by a successful submission.
  for (const key of keys) await assertUnreferencedFile(key);
  for (const key of keys) {
    await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
  }
  return res.status(200).json({ message: 'Files deleted successfully' });
}

export default withApiAuth(handler, { methods: ['POST'] });
