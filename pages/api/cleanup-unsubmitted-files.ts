import { NextApiRequest, NextApiResponse } from 'next';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let fileKeys: string[];

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    fileKeys = body.fileKeys;

    if (!fileKeys || !Array.isArray(fileKeys)) {
      return res.status(400).json({ message: 'File keys array is required' });
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return res.status(400).json({ message: 'Invalid request body' });
  }

  try {
    const deletePromises = fileKeys.map(fileKey => {
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
      });
      return s3Client.send(command);
    });

    await Promise.all(deletePromises);
    
    console.log('Files deleted successfully:', fileKeys);
    res.status(200).json({ message: 'Files deleted successfully' });
  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).json({ message: 'Error deleting files', error: error.message });
  }
}