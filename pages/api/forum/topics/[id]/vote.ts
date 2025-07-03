import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { vote } = req.body; // 1 for upvote, -1 for downvote, 0 to remove vote

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid topic ID' });
  }

  if (![1, -1, 0].includes(vote)) {
    return res.status(400).json({ error: 'Invalid vote value' });
  }

  let token = req.cookies.token;
  // Fallback to Authorization header if cookie is not present
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    // Start transaction
    await db.transaction(async (trx) => {
      // Check if user has already voted
      const existingVote = await trx('forum_votes')
        .where({ user_id: decoded.userId, topic_id: id })
        .first();

      if (vote === 0) {
        // Remove vote
        if (existingVote) {
          await trx('forum_votes')
            .where({ user_id: decoded.userId, topic_id: id })
            .delete();

          // Update vote counts
          if (existingVote.vote_value === 1) {
            await trx('forum_topics')
              .where({ id })
              .decrement('upvotes', 1)
              .decrement('score', 1);
          } else {
            await trx('forum_topics')
              .where({ id })
              .decrement('downvotes', 1)
              .increment('score', 1);
          }
        }
      } else {
        if (existingVote) {
          // Update existing vote
          if (existingVote.vote_value !== vote) {
            await trx('forum_votes')
              .where({ user_id: decoded.userId, topic_id: id })
              .update({ vote_value: vote });

            // Update vote counts
            if (existingVote.vote_value === 1 && vote === -1) {
              await trx('forum_topics')
                .where({ id })
                .decrement('upvotes', 1)
                .increment('downvotes', 1)
                .decrement('score', 2);
            } else if (existingVote.vote_value === -1 && vote === 1) {
              await trx('forum_topics')
                .where({ id })
                .increment('upvotes', 1)
                .decrement('downvotes', 1)
                .increment('score', 2);
            }
          }
        } else {
          // Insert new vote
          await trx('forum_votes').insert({
            user_id: decoded.userId,
            topic_id: id,
            vote_value: vote
          });

          // Update vote counts
          if (vote === 1) {
            await trx('forum_topics')
              .where({ id })
              .increment('upvotes', 1)
              .increment('score', 1);
          } else {
            await trx('forum_topics')
              .where({ id })
              .increment('downvotes', 1)
              .decrement('score', 1);
          }
        }
      }
    });

    // Get updated topic with vote counts
    const updatedTopic = await db('forum_topics')
      .where({ id })
      .select('upvotes', 'downvotes', 'score')
      .first();

    res.status(200).json({
      success: true,
      upvotes: updatedTopic.upvotes,
      downvotes: updatedTopic.downvotes,
      score: updatedTopic.score,
      userVote: vote
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
}