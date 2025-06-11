import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

const CDN_URL = process.env.CDN_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  try {
    const fullImageUrl = `${CDN_URL}${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
    await db('pdfs').where('id', id).update({ image_url: fullImageUrl });
    res.status(200).json({ message: 'PDF image updated successfully', updatedUrl: fullImageUrl });
  } catch (error) {
    console.error('Error updating PDF image:', error);
    res.status(500).json({ message: 'Error updating PDF image' });
  }
}
