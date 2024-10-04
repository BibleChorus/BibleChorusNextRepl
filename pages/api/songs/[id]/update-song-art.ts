import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

const CDN_URL = process.env.CDN_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { songArtUrl } = req.body;

  if (!songArtUrl) {
    return res.status(400).json({ message: 'Song art URL is required' });
  }

  try {
    // Prepend CDN_URL to songArtUrl, ensuring no double slashes
    const fullSongArtUrl = `${CDN_URL}${songArtUrl.startsWith('/') ? songArtUrl.slice(1) : songArtUrl}`;
    
    await db('songs')
      .where('id', id)
      .update({
        song_art_url: fullSongArtUrl,
      });
    
    res.status(200).json({ message: 'Song art updated successfully', updatedUrl: fullSongArtUrl });
  } catch (error) {
    console.error('Error updating song art:', error);
    res.status(500).json({ message: 'Error updating song art' });
  }
}