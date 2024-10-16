import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  const topicId = Number(id);

  if (method === 'POST') {
    const { content, user_id, parent_comment_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const [comment] = await db('forum_comments')
        .insert({
          content,
          user_id,
          topic_id: topicId,
          parent_comment_id: parent_comment_id || null,
          created_at: new Date(),
        })
        .returning('*');

      const user = await db('users').where('id', user_id).first();

      res.status(201).json({ ...comment, username: user.username });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Error adding comment' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
