import axios from 'axios';
import { toast } from 'sonner';

export async function uploadFile(
  file: File,
  fileType: 'audio' | 'image',
  userId: number
) {
  const fileExtension = file.name ? file.name.split('.').pop() : 'jpg'; // Default to 'jpg' if no name
  const contentType = file.type || 'image/jpeg';
  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

  try {
    const { data } = await axios.post('/api/upload-url', {
      fileType: file.type,
      fileExtension,
      title: 'playlist_cover',
      userId,
      fileSize: file.size,
    });

    await axios.put(data.signedUrl, file, {
      headers: {
        'Content-Type': contentType,
      },
    });

    return `${CDN_URL}${data.fileKey}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error(`Upload failed: ${error.message}`);
    throw error;
  }
}