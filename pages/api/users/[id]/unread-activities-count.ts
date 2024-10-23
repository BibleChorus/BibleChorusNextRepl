import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract and verify the token
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number }; // Changed from id to userId
      // Verify that the user is requesting their own data
      if (decoded.userId !== Number(id)) { // Changed from id to userId
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Fetch counts of unread activities from different tables
    const [songCommentsCount] = await db('song_comments')
      .where('user_id', id)
      .andWhere('is_new', true)
      .count({ count: 'id' });

    const [forumCommentsCount] = await db('forum_comments')
      .where('user_id', id)
      .andWhere('is_new', true)
      .count({ count: 'id' });

    const [songUploadsCount] = await db('songs')
      .where('uploaded_by', id)
      .andWhere('is_new', true)
      .count({ count: 'id' });

    const [likesCount] = await db('likes')
      .join('songs', 'songs.id', 'likes.likeable_id')
      .where('songs.uploaded_by', id)
      .andWhere('likes.likeable_type', 'song')
      .andWhere('likes.is_new', true)
      .count({ count: 'likes.id' });

    const [votesCount] = await db('votes')
      .join('songs', 'songs.id', 'votes.song_id')
      .where('songs.uploaded_by', id)
      .andWhere('votes.is_new', true)
      .count({ count: 'votes.id' });

    // Sum up the counts
    const totalUnreadCount =
      Number(songCommentsCount.count) +
      Number(forumCommentsCount.count) +
      Number(songUploadsCount.count) +
      Number(likesCount.count) +
      Number(votesCount.count);

    return res.status(200).json({ unreadCount: totalUnreadCount });
  } catch (error) {
    console.error('Error fetching unread activities count:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
