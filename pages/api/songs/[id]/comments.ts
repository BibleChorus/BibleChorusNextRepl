import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import sanitizeHtml from 'sanitize-html';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Note: Session handling can be added back once NextAuth v5 migration is complete
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
    const { comment, parent_comment_id, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const sanitizedComment = sanitizeHtml(comment, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] },
      });

      const [newComment] = await db('song_comments')
        .insert({
          song_id: songId,
          user_id,
          comment: sanitizedComment,
          parent_comment_id: parent_comment_id || null,
          created_at: new Date(),
        })
        .returning('*');

      const user = await db('users').where('id', user_id).first();

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
