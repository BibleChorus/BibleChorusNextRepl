import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    // Fetch all topics
    try {
      // Get user ID from token if available
      let userId: number | null = null;
      const token = req.cookies.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
          userId = decoded.userId;
        } catch (error) {
          // Token invalid, continue without user context
        }
      }

      const topics = await db('forum_topics')
        .join('users', 'forum_topics.user_id', 'users.id')
        .leftJoin('forum_categories', 'forum_topics.category_id', 'forum_categories.id')
        .select(
          'forum_topics.*',
          'users.username',
          db.raw('COALESCE(forum_categories.name, ?) as category', ['Uncategorized'])
        )
        .orderBy('forum_topics.created_at', 'desc');

      // Get replies count for each topic
      const topicIds = topics.map(topic => topic.id);
      const repliesCounts = await db('forum_comments')
        .whereIn('topic_id', topicIds)
        .groupBy('topic_id')
        .select('topic_id', db.raw('COUNT(*) as replies_count'));

      const repliesCountMap = new Map(repliesCounts.map(r => [r.topic_id, parseInt(r.replies_count)]));

      // If user is logged in, get their votes
      if (userId) {
        const userVotes = await db('forum_votes')
          .where({ user_id: userId })
          .whereNotNull('topic_id')
          .select('topic_id', 'vote_value');

        const voteMap = new Map(userVotes.map(v => [v.topic_id, v.vote_value]));
        
        // Add user vote and other calculated fields to each topic
        topics.forEach(topic => {
          topic.userVote = voteMap.get(topic.id) || 0;
          topic.replies_count = repliesCountMap.get(topic.id) || 0;
          topic.preview = topic.content ? topic.content.substring(0, 150) + (topic.content.length > 150 ? '...' : '') : '';
        });
      } else {
        // Add calculated fields without user votes
        topics.forEach(topic => {
          topic.replies_count = repliesCountMap.get(topic.id) || 0;
          topic.preview = topic.content ? topic.content.substring(0, 150) + (topic.content.length > 150 ? '...' : '') : '';
        });
      }

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

      // Add calculated fields to the new topic
      const topicWithFields = {
        ...topic,
        username: user.username,
        replies_count: 0,
        preview: topic.content ? topic.content.substring(0, 150) + (topic.content.length > 150 ? '...' : '') : ''
      };

      res.status(201).json(topicWithFields);
    } catch (error) {
      console.error('Error creating topic:', error);
      res.status(500).json({ message: 'Error creating topic' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
