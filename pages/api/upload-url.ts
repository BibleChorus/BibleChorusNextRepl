import { NextApiRequest, NextApiResponse } from 'next';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileType, fileExtension, title, userId } = req.body;

  if (!fileType || !fileExtension || !userId) {
    return res.status(400).json({ message: 'File type, extension, and user ID are required' });
  }

  // Format current date and time
  const now = new Date();
  const formattedDate = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14); // yyyymmddhhMMss

  // Sanitize the title to create a safe filename
  const sanitizedTitle = title
    ? title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_')
    : uuidv4();

  let fileName: string;
  let fileKey: string;

  if (fileType.startsWith('audio/')) {
    // Audio files: uploads/userId/audio/yyyyMMddhhMMss.FILENAME.EXT
    fileName = `${formattedDate}.${sanitizedTitle}.${fileExtension}`;
    fileKey = `uploads/${userId}/audio/${fileName}`;
  } else if (fileType.startsWith('image/')) {
    // Image files: uploads/userId/song_art/yyyyMMddhhMMss.FILENAME.EXT
    fileName = `${formattedDate}.${sanitizedTitle}.${fileExtension}`;
    fileKey = `uploads/${userId}/song_art/${fileName}`;
  } else {
    return res.status(400).json({ message: 'Unsupported file type' });
  }

  console.log('Received fileType:', fileType);
  console.log('Received fileExtension:', fileExtension);
  console.log('Received title:', title);
  console.log('Received userId:', userId);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.status(200).json({ signedUrl, fileKey });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Error generating signed URL' });
  }
}