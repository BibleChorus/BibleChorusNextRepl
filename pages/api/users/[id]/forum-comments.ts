import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      console.log('Fetching forum comments for user:', id);
      const forumComments = await db('forum_comments')
        .join('forum_topics', 'forum_comments.topic_id', 'forum_topics.id')
        .where('forum_comments.user_id', id)
        .select(
          'forum_comments.id',
          'forum_comments.content',
          'forum_comments.created_at',
          'forum_topics.id as topic_id',
          'forum_topics.title as topic_title'
        )
        .orderBy('forum_comments.created_at', 'desc');

      console.log('Fetched forum comments:', forumComments);
      res.status(200).json(forumComments);
    } catch (error) {
      console.error('Error fetching forum comments:', error);
      res.status(500).json({ message: 'Error fetching forum comments', error: error.toString() });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
