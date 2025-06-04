import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { title, author, ai_assisted, themes, pdf_url, uploaded_by } = req.body;

  if (!title || !pdf_url || !uploaded_by || !Array.isArray(themes) || themes.length === 0) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [inserted] = await db('pdfs')
      .insert({
        title,
        author: author || null,
        pdf_url,
        ai_assisted: ai_assisted || false,
        themes,
        uploaded_by,
        created_at: new Date()
      })
      .returning('id');

    res.status(200).json({ id: inserted.id });
  } catch (error) {
    console.error('Error saving PDF:', error);
    res.status(500).json({ message: 'Error saving PDF' });
  }
}
