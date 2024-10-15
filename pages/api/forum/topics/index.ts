import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    // Fetch all topics
    try {
      const topics = await db('forum_topics')
        .join('users', 'forum_topics.user_id', 'users.id')
        .select(
          'forum_topics.*',
          'users.username'
        )
        .orderBy('forum_topics.created_at', 'desc');

      res.status(200).json(topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      res.status(500).json({ message: 'Error fetching topics' });
    }
  } else if (method === 'POST') {
    // Create a new topic
    const { title, content, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const [topic] = await db('forum_topics')
        .insert({
          title,
          content,
          user_id,
          created_at: new Date(),
        })
        .returning('*');

      const user = await db('users').where('id', user_id).first();

      res.status(201).json({ ...topic, username: user.username });
    } catch (error) {
      console.error('Error creating topic:', error);
      res.status(500).json({ message: 'Error creating topic' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}