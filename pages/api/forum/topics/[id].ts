import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  const topicId = Number(id);

  if (method === 'GET') {
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

      const topic = await db('forum_topics')
        .join('users', 'forum_topics.user_id', 'users.id')
        .select('forum_topics.*', 'users.username')
        .where('forum_topics.id', topicId)
        .first();

      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
      }

      // Get user's vote for the topic
      if (userId) {
        const userVote = await db('forum_votes')
          .where({ user_id: userId, topic_id: topicId })
          .first();
        topic.userVote = userVote ? userVote.vote_value : 0;
      }

      const comments = await db('forum_comments')
        .join('users', 'forum_comments.user_id', 'users.id')
        .select('forum_comments.*', 'users.username')
        .where('forum_comments.topic_id', topicId)
        .orderBy('forum_comments.created_at', 'desc');

      // Get user votes for comments
      if (userId && comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        const userVotes = await db('forum_votes')
          .where({ user_id: userId })
          .whereIn('comment_id', commentIds)
          .select('comment_id', 'vote_value');

        const voteMap = new Map(userVotes.map(v => [v.comment_id, v.vote_value]));
        
        // Add user vote to each comment
        comments.forEach(comment => {
          comment.userVote = voteMap.get(comment.id) || 0;
        });
      }

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