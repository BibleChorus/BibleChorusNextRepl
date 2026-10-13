import { withApiAuth } from '@/lib/server-auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from '@/lib/s3';
import { randomUUID as uuidv4 } from 'node:crypto';
import formidable from 'formidable';
import fs from 'fs';
import { requireUser } from '@/lib/server-auth';

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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  const form = formidable({ maxFileSize: 5 * 1024 * 1024, maxFiles: 1, allowEmptyFiles: false });

  form.parse(req, async (err, fields: Fields, files: formidable.Files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(400).json({ message: 'Choose an image smaller than 5MB' });
    }

    const file = (Array.isArray(files.file) ? files.file[0] : files.file) as File | undefined;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    try {
      if (!file.mimetype?.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Choose an image smaller than 5MB' });
      }
      const fileContent = await fs.promises.readFile(file.filepath);
      const candidateExtension = file.originalFilename?.split('.').pop() || 'jpg';
      const fileExtension = /^[a-zA-Z0-9]{1,10}$/.test(candidateExtension) ? candidateExtension : 'jpg';
      const fileName = `${uuidv4()}.${fileExtension}`;
      const fileKey = `uploads/${user.id}/song_art/${fileName}`;

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
        await fs.promises.unlink(file.filepath).catch(() => undefined);
      }
    }
  });
}

export default withApiAuth(handler, { methods: ['POST'] });
