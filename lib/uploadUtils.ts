import axios from 'axios';
import { toast } from 'sonner';

export async function uploadFile(
  file: File, 
  type: 'image' | 'audio', 
  userId: number, 
  uploadType: 'song_art' | 'playlist_cover' = 'song_art' // Default to 'song_art'
) {
  const response = await axios.post('/api/upload-url', { 
    fileType: file.type, 
    fileExtension: file.name.split('.').pop(), 
    title: file.name, 
    userId, 
    fileSize: file.size,
    uploadType, // Pass uploadType to the API
  });

  if (response.status !== 200) {
    return response.data.message;
  }

  const { signedUrl, fileKey } = response.data;

  try {
    await axios.put(signedUrl, file, { headers: { 'Content-Type': file.type } });
    return { fileKey };
  } catch (error) {
    console.error('Error uploading file:', error);
    return 'Failed to upload file';
  }
}
