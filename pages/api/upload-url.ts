import type { NextApiRequest, NextApiResponse } from 'next';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID as uuidv4 } from 'node:crypto';
import { z } from 'zod';
import s3Client from '@/lib/s3';
import { requireUser, withApiAuth } from '@/lib/server-auth';

const upload = z.object({
  fileType: z.string().max(100),
  fileExtension: z.string().regex(/^[a-zA-Z0-9]{1,10}$/),
  title: z.string().max(500).optional(),
  fileSize: z.coerce.number().int().positive(),
  uploadType: z.enum(['song_art', 'playlist_cover', 'profile_image', 'pdf', 'pdf_image']).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const parsed = upload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Provide a valid file type, extension, and size' });
  const { fileType, fileExtension, title, fileSize, uploadType } = parsed.data;
  const isAudio = /^audio\/[a-zA-Z0-9.+-]+$/.test(fileType);
  const isImage = /^image\/[a-zA-Z0-9.+-]+$/.test(fileType);
  const isPdf = fileType === 'application/pdf';
  if (!isAudio && !isImage && !isPdf) return res.status(400).json({ message: 'Unsupported file type' });
  const maximum = (isAudio ? 200 : isImage ? 5 : 10) * 1024 * 1024;
  if (fileSize > maximum) return res.status(400).json({ message: `File size exceeds the limit of ${maximum / 1024 / 1024}MB` });
  const safeTitle = (title || 'upload').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_').slice(0, 100) || 'upload';
  const folder = isAudio ? 'audio' : isPdf ? 'pdfs' : uploadType || 'song_art';
  const extension = isPdf ? 'pdf' : fileExtension.toLowerCase();
  const fileKey = `uploads/${user.id}/${folder}/${Date.now()}.${uuidv4()}.${safeTitle}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    ContentLength: fileSize,
  });
  const signedUrl = await getSignedUrl(s3Client as any, command, { expiresIn: 900, signableHeaders: new Set(['content-type']) });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ signedUrl, fileKey });
}

export default withApiAuth(handler, { methods: ['POST'] });
