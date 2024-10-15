import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  const topicId = Number(id);

  if (method === 'GET') {
    try {
      const topic = await db('forum_topics')
        .join('users', 'forum_topics.user_id', 'users.id')
        .select('forum_topics.*', 'users.username')
        .where('forum_topics.id', topicId)
        .first();

      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
      }

      const comments = await db('forum_comments')
        .join('users', 'forum_comments.user_id', 'users.id')
        .select('forum_comments.*', 'users.username')
        .where('forum_comments.topic_id', topicId)
        .orderBy('forum_comments.created_at', 'desc');

      res.status(200).json({ ...topic, comments });
    } catch (error) {
      console.error('Error fetching topic:', error);
      res.status(500).json({ message: 'Error fetching topic' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}