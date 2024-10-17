import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

// Use 'process.env.CDN_URL' for server-side code
const CDN_URL = process.env.CDN_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { profileImageUrl } = req.body;

  try {
    // Ensure the profileImageUrl doesn't already include the CDN_URL
    const fullProfileImageUrl = profileImageUrl.startsWith(CDN_URL)
      ? profileImageUrl
      : `${CDN_URL.replace(/\/+$/, '')}/${profileImageUrl.replace(/^\/+/, '')}`;

    await db('users')
      .where('id', id)
      .update({ profile_image_url: fullProfileImageUrl });

    res.status(200).json({ message: 'Profile image updated successfully', updatedUrl: fullProfileImageUrl });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Error updating profile image', error: error.message });
  }
}
