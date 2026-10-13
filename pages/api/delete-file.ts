import type { NextApiRequest, NextApiResponse } from 'next';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3';
import { requireUser, withApiAuth } from '@/lib/server-auth';
import { assertUnreferencedFile, ownedStorageKey } from '@/lib/storage-keys';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const key = ownedStorageKey(req.body?.fileKey, user.id);
  await assertUnreferencedFile(key);
  await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
  return res.status(200).json({ message: 'File deleted successfully' });
}

export default withApiAuth(handler, { methods: ['POST'] });
