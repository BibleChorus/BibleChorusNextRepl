import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import sanitizeHtml from 'sanitize-html';
import { requireUser, withApiAuth } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const songId = Number(req.query.id);

  if (method === 'GET') {
    // Fetch comments for the song (no authentication required for reading)
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
    const authenticatedUserId = (await requireUser(req, res)).id;

    const { comment, parent_comment_id } = req.body;

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
      if (!(await db('songs').where({ id: songId }).first())) return res.status(404).json({ message: 'Song not found' });
      if (parent_comment_id && !(await db('song_comments').where({ id: parent_comment_id, song_id: songId }).first())) {
        return res.status(400).json({ message: 'Reply must belong to this song' });
      }
      const sanitizedComment = sanitizeHtml(comment, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] },
      });

      const [newComment] = await db('song_comments')
        .insert({
          song_id: songId,
          user_id: authenticatedUserId,
          comment: sanitizedComment,
          parent_comment_id: parent_comment_id || null,
          created_at: new Date(),
        })
        .returning('*');

      const user = await db('users').where('id', authenticatedUserId).first();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(201).json({
        ...newComment,
        username: user.username,
        profile_image_url: user.profile_image_url,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Error adding comment' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}


export default withApiAuth(handler, { methods: ['POST'] });
