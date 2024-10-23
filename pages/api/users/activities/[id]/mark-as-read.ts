import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const [activityType, activityId] = id.toString().split('_');

    // Update the appropriate table based on activity type
    switch (activityType) {
      case 'song-comment':
        await db('song_comments')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'forum-comment':
        await db('forum_comments')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'song-upload':
        await db('songs')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'song-like':
        await db('likes')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'song-vote':
        await db('votes')
          .where('id', activityId)
          .update({ is_new: false });
        break;
    }

    return res.status(200).json({ message: 'Activity marked as read' });
  } catch (error) {
    console.error('Error marking activity as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
