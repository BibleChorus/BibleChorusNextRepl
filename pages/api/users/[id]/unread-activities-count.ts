import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Verify the user's authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
      if (decoded.userId !== Number(id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Fetch counts of unread activities from different tables, excluding actions by the user themselves
    const [songCommentsCount] = await db('song_comments')
      .join('songs', 'songs.id', 'song_comments.song_id')
      .where('songs.uploaded_by', id)
      .andWhere('song_comments.is_new', true)
      .andWhere(db.raw('song_comments.user_id != ?', [id]))
      .count({ count: 'song_comments.id' });

    const [forumCommentsCount] = await db('forum_comments')
      .leftJoin('forum_topics', 'forum_comments.topic_id', 'forum_topics.id')
      .where(function () {
        this.where('forum_topics.user_id', id).orWhereIn('forum_comments.parent_comment_id', function () {
          this.select('id')
            .from('forum_comments')
            .where('user_id', id);
        });
      })
      .andWhere('forum_comments.is_new', true)
      .andWhere(db.raw('forum_comments.user_id != ?', [id]))
      .count({ count: 'forum_comments.id' });

    const [likesCount] = await db('likes')
      .join('songs', 'songs.id', 'likes.likeable_id')
      .where('songs.uploaded_by', id)
      .andWhere('likes.likeable_type', 'song')
      .andWhere('likes.is_new', true)
      .andWhere(db.raw('likes.user_id != ?', [id]))
      .count({ count: 'likes.id' });

    const [votesCount] = await db('votes')
      .join('songs', 'songs.id', 'votes.song_id')
      .where('songs.uploaded_by', id)
      .andWhere('votes.is_new', true)
      .andWhere(db.raw('votes.user_id != ?', [id]))
      .count({ count: 'votes.id' });

    // Sum up the counts
    const totalUnreadCount =
      Number(songCommentsCount.count) +
      Number(forumCommentsCount.count) +
      Number(likesCount.count) +
      Number(votesCount.count);

    return res.status(200).json({ unreadCount: totalUnreadCount });
  } catch (error) {
    console.error('Error fetching unread activities count:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
