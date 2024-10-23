import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    // Split id into activityType and activityId from the right
    const lastUnderscoreIndex = id.lastIndexOf('_');
    const activityType = id.substring(0, lastUnderscoreIndex);
    const activityId = id.substring(lastUnderscoreIndex + 1);

    // Update the appropriate table based on activity type
    switch (activityType) {
      case 'song-comment':
      case 'song_comment':
        await db('song_comments')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'forum-comment':
      case 'forum_comment':
        await db('forum_comments')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'song-upload':
      case 'song_upload':
        await db('songs')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'song-like':
      case 'song_like':
        await db('likes')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      case 'song-vote':
      case 'song_vote':
        await db('votes')
          .where('id', activityId)
          .update({ is_new: false });
        break;
      default:
        console.error('Unknown activity type:', activityType);
        return res.status(400).json({ message: 'Invalid activity type' });
    }

    return res.status(200).json({ message: 'Activity marked as read' });
  } catch (error) {
    console.error('Error marking activity as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
