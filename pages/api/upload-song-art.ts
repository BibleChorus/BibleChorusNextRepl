import { NextApiRequest, NextApiResponse } from 'next';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface Fields {
  [key: string]: string | string[] | undefined;
}

interface File extends formidable.File {
  filepath: string;
  originalFilename: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = formidable();

  form.parse(req, async (err, fields: Fields, files: formidable.Files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ message: 'Error parsing form' });
    }

    const file = files.file && !Array.isArray(files.file) ? files.file as File : undefined;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const userId = fields.userId && !Array.isArray(fields.userId) ? fields.userId : undefined;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    try {
      const fileContent = await fs.promises.readFile(file.filepath);
      const fileExtension = file.originalFilename?.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${fileExtension}`;
      const fileKey = `uploads/${userId}/song_art/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
        Body: fileContent,
        ContentType: file.mimetype || 'image/jpeg',
      });

      await s3Client.send(command);

      res.status(200).json({ fileKey });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Error uploading file' });
    } finally {
      // Clean up the temporary file
      if (file.filepath) {
        await fs.promises.unlink(file.filepath);
      }
    }
  });
}