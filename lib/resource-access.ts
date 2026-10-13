import type { User } from '@/types';
import db from '@/db';
import { ApiError } from '@/lib/server-auth';

export async function requireReadablePdf(pdfId: number, viewer: User | null) {
  const pdf = await db('pdfs').where({ id: pdfId }).first();
  if (!pdf || (pdf.is_public === false && Number(pdf.uploaded_by) !== viewer?.id)) throw new ApiError(404, 'PDF not found');
  return pdf;
}
