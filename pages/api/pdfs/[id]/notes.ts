import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import db from '@/db';
import { ApiError, readId, requireUser, withApiAuth } from '@/lib/server-auth';
import { requireReadablePdf } from '@/lib/resource-access';

const noteSchema = z.object({
  note: z.string().trim().min(1).max(100000),
  page_number: z.number().int().positive().nullable().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST'].includes(req.method || '')) return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const pdfId = readId(req.query.id, 'PDF ID');
  await requireReadablePdf(pdfId, user);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    const notes = await db('pdf_notes').where({ pdf_id: pdfId, user_id: user.id }).orderBy('created_at', 'desc');
    return res.status(200).json(notes);
  }
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Provide a note and an optional positive page number');
  const [note] = await db('pdf_notes').insert({ ...parsed.data, pdf_id: pdfId, user_id: user.id }).returning('*');
  return res.status(201).json(note);
}

export default withApiAuth(handler, { methods: ['GET', 'POST'] });
