import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { pdfToText, extractBibleVerses } from '@/lib/pdfUtils';
import { getVerseIds } from '@/pages/api/utils';
import { promises as fs } from 'fs';
import formidable from 'formidable';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const teachings = await db('teachings').select('*').orderBy('created_at', 'desc');
  res.status(200).json(teachings);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const form = formidable();
  const { files, fields } = await form.parse(req);
  const file = files.pdf as formidable.File;
  const buffer = await fs.readFile(file.filepath);
  const text = await pdfToText(buffer);
  const verses = extractBibleVerses(text);

  // Determine user folder or fallback
  const userId = fields.user_id ? String(fields.user_id) : 'anonymous';

  const fileExtension = file.originalFilename?.split('.').pop() || 'pdf';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const fileKey = `uploads/${userId}/teaching_pdfs/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: file.mimetype || 'application/pdf',
  });

  await s3Client.send(command);

  const CDN_URL = process.env.CDN_URL || '';
  const fullPdfUrl = `${CDN_URL}${fileKey}`;

  const [id] = await db('teachings')
    .insert({
      title: fields.title as string,
      slug: slugify(fields.title as string),
      description: fields.description as string,
      pdf_url: fullPdfUrl,
      pdf_text: text,
      based_on_type: fields.based_on_type as string,
      reference: fields.reference as string,
      ai_generated: fields.ai_generated === 'true',
      ai_prompt: fields.ai_prompt as string,
      ai_model_used: fields.ai_model_used as string,
      tags: fields.tags ? (fields.tags as string).split(',').map(t => t.trim()) : null,
      language: (fields.language as string) || 'en',
      uploaded_by: fields.user_id ? Number(fields.user_id) : null,
    })
    .returning('id');

  if (verses.length > 0) {
    const verseIds = await getVerseIds(verses);
    const rows = verseIds.map(v => ({ teaching_id: id, verse_id: v }));
    await db('teaching_verses').insert(rows);
  }

  // Remove temporary file
  if (file.filepath) {
    await fs.unlink(file.filepath);
  }

  res.status(201).json({ id });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
