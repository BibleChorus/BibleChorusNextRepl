import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { ApiError, readId, requireUser, withApiAuth } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const noteId = readId(req.query.noteId, 'note ID');
  const pdfId = readId(req.query.id, 'PDF ID');
  const deleted = await db('pdf_notes').where({ id: noteId, pdf_id: pdfId, user_id: user.id }).delete();
  if (!deleted) throw new ApiError(404, 'Note not found');
  return res.status(200).json({ message: 'Note deleted' });
}

export default withApiAuth(handler, { methods: ['DELETE'] });
