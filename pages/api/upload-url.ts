import { NextApiRequest, NextApiResponse } from 'next';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

// Add these constants at the top of the file
const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Add 'uploadType' to the request body
  const { fileType, fileExtension, title, userId, fileSize, uploadType } = req.body;

  // Define allowed upload types
  const allowedUploadTypes = ['song_art', 'playlist_cover'];
  const finalUploadType = uploadType && allowedUploadTypes.includes(uploadType) ? uploadType : 'song_art';

  if (!fileType || !fileExtension || !userId || !fileSize) {
    return res.status(400).json({ message: 'File type, extension, user ID, and file size are required' });
  }

  // Check file size
  const maxSize = fileType.startsWith('audio/') ? MAX_AUDIO_FILE_SIZE : MAX_IMAGE_FILE_SIZE;
  if (parseInt(fileSize) > maxSize) {
    const sizeInMB = maxSize / (1024 * 1024);
    return res.status(400).json({ message: `File size exceeds the limit of ${sizeInMB}MB` });
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
    // Construct the file name
    fileName = `${formattedDate}.${sanitizedTitle}.${fileExtension}`;
    
    // Set the file key based on uploadType
    fileKey = `uploads/${userId}/${finalUploadType}/${fileName}`;
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
    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600,
      signingRegion: process.env.AWS_REGION,
    });

    // Remove the content-length restriction
    res.status(200).json({ signedUrl, fileKey });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Error generating signed URL' });
  }
}
