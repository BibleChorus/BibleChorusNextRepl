import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const teachingId = Number(req.query.id);
  if (req.method === 'GET') {
    const comments = await db('teaching_comments')
      .join('users', 'teaching_comments.user_id', 'users.id')
      .where('teaching_comments.teaching_id', teachingId)
      .select('teaching_comments.*', 'users.username');
    res.status(200).json(comments);
  } else if (req.method === 'POST') {
    const { comment, user_id, parent_comment_id } = req.body;
    const [id] = await db('teaching_comments')
      .insert({ teaching_id: teachingId, user_id, comment, parent_comment_id })
      .returning('id');
    const newComment = await db('teaching_comments')
      .where({ id })
      .join('users', 'teaching_comments.user_id', 'users.id')
      .first('teaching_comments.*', 'users.username');
    res.status(201).json(newComment);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end();
  }
}
