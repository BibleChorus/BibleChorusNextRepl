import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import sanitizeHtml from 'sanitize-html';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const pdfId = Number(req.query.id);

  if (method === 'GET') {
    try {
      const comments = await db('pdf_comments')
        .join('users', 'pdf_comments.user_id', 'users.id')
        .select(
          'pdf_comments.*',
          'users.username',
          'users.profile_image_url'
        )
        .where('pdf_comments.pdf_id', pdfId)
        .orderBy('pdf_comments.created_at', 'asc');

      res.status(200).json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  } else if (method === 'POST') {
    const { comment, parent_comment_id, user_id } = req.body;

    if (!user_id || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      const sanitizedComment = sanitizeHtml(comment, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] },
      });

      const [newComment] = await db('pdf_comments')
        .insert({
          pdf_id: pdfId,
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
