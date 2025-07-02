import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { auth } from '@/auth';
import sanitizeHtml from 'sanitize-html';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    // SECURITY: Authenticate user before allowing comment creation
    const session = await auth(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Authentication required to post comments' });
    }

    // Extract comment data from request body (ignore any user_id - use authenticated user)
    const { comment, parent_comment_id } = req.body;
    
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
      const sanitizedComment = sanitizeHtml(comment, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] },
      });

      // Use the authenticated user's ID from the session
      const authenticatedUserId = session.user.id;

      const [newComment] = await db('song_comments')
        .insert({
          song_id: songId,
          user_id: authenticatedUserId,
          comment: sanitizedComment,
          parent_comment_id: parent_comment_id || null,
          created_at: new Date(),
        })
        .returning('*');

      // Get user details for response
      const user = await db('users').where('id', authenticatedUserId).first();

      res.status(201).json({ 
        ...newComment, 
        username: user?.username || session.user.username,
        profile_image_url: user?.profile_image_url || session.user.profile_image_url
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
