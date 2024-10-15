import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

const CDN_URL = process.env.CDN_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { coverArtUrl } = req.body;

  try {
    const fullCoverArtUrl = `${CDN_URL}${coverArtUrl}`; // Prepend CDN_URL here

    const updatedPlaylist = await db('playlists')
      .where({ id })
      .update({
        cover_art_url: fullCoverArtUrl,
        last_updated: new Date(),
      })
      .returning('*');

    if (updatedPlaylist.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.status(200).json({ message: 'Playlist cover art updated successfully', updatedUrl: fullCoverArtUrl });
  } catch (error) {
    console.error('Error updating playlist cover art:', error);
    res.status(500).json({ message: 'Error updating playlist cover art', error: error.message });
  }
}
