import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const songId = Number(req.query.id);

  if (method === 'GET') {
    // Fetch comments for the song
    try {
      const comments = await db('song_comments')
        .join('users', 'song_comments.user_id', 'users.id')
        .select(
          'song_comments.*',
          'users.username',
          'users.profile_image_url'
        )
        .where('song_comments.song_id', songId)
        .orderBy('song_comments.created_at', 'asc');

      res.status(200).json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  } else if (method === 'POST') {
    // Create a new comment
    const { comment, parent_comment_id } = req.body;
    const session = await getSession({ req });

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const [newComment] = await db('song_comments')
        .insert({
          song_id: songId,
          user_id: session.user.id,
          comment,
          parent_comment_id,
          created_at: new Date(),
        })
        .returning('*');

      const user = await db('users').where('id', session.user.id).first();

      res.status(201).json({ ...newComment, username: user.username });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Error adding comment' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
