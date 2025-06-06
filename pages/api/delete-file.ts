import { NextApiRequest, NextApiResponse } from 'next';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';

const CDN_URL = process.env.CDN_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Delete file API route called');
  // Changed method from 'DELETE' to 'POST'
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileKey } = req.body;
  console.log('Received file key:', fileKey);

  if (!fileKey) {
    console.log('No file key provided');
    return res.status(400).json({ message: 'File key is required' });
  }

  // Extract the key by removing the CDN_URL and any leading slashes
  const actualFileKey = fileKey.replace(CDN_URL, '').replace(/^\/+/, '');

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: actualFileKey,
  });

  try {
    console.log('Attempting to delete file:', actualFileKey);
    await s3Client.send(command);
    console.log('File deleted successfully:', actualFileKey);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
}