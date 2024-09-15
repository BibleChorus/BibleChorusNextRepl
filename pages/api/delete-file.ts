import { NextApiRequest, NextApiResponse } from 'next';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileKey } = req.body;

  if (!fileKey) {
    return res.status(400).json({ message: 'File key is required' });
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
  });

  try {
    console.log('Attempting to delete file:', fileKey);
    await s3Client.send(command);
    console.log('File deleted successfully:', fileKey);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
}