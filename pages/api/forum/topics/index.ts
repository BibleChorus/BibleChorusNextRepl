import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    // Fetch all topics
    try {
      const topics = await db('forum_topics')
        .join('users', 'forum_topics.user_id', 'users.id')
        .leftJoin('forum_categories', 'forum_topics.category_id', 'forum_categories.id')
        .select(
          'forum_topics.*',
          'users.username',
          db.raw('COALESCE(forum_categories.name, ?) as category', ['Uncategorized'])
        )
        .orderBy('forum_topics.created_at', 'desc');

      res.status(200).json(topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      res.status(500).json({ message: 'Error fetching topics' });
    }
  } else if (method === 'POST') {
    // Create a new topic
    const { title, content, user_id, category_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Check if the category is "Announcements" and if the user is allowed to post in it
      const category = await db('forum_categories').where('id', category_id).first();
      if (category && category.name === 'Announcements' && user_id !== 1) {
        return res.status(403).json({ message: 'You are not authorized to post in the Announcements category' });
      }

      const [topic] = await db('forum_topics')
        .insert({
          title,
          content,
          user_id,
          category_id: category_id || null,
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
