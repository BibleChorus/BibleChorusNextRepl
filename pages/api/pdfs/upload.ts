import { NextApiRequest, NextApiResponse } from 'next';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3';
import db from '@/db';
import { Knex } from 'knex';
import { BIBLE_BOOKS } from '@/lib/constants';

// Helper to convert a readable stream to a Buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', err => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const {
    title,
    author,
    ai_assisted,
    themes,
    pdf_url,
    uploaded_by,
    notebook_lm_url,
    summary,
    source_url,
  } = body;

  const missingFields: string[] = [];
  if (!title) missingFields.push('title');
  if (!pdf_url) missingFields.push('pdf_url');
  if (!uploaded_by) missingFields.push('uploaded_by');
  if (!Array.isArray(themes) || themes.length === 0) missingFields.push('themes');

  if (
    notebook_lm_url &&
    !/^https?:\/\/notebooklm\.google\.com\//.test(notebook_lm_url)
  ) {
    return res
      .status(400)
      .json({ message: 'Invalid NotebookLM URL' });
  }

  if (source_url && !/^https?:\/\//.test(source_url)) {
    return res.status(400).json({ message: 'Invalid source URL' });
  }

  console.log('Validation results - missing fields:', missingFields);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: 'Missing required fields', missingFields });
  }

  try {
    // Retrieve PDF from S3
    const fileKey = pdf_url.replace(process.env.CDN_URL || '', '').replace(/^\/+/, '');
    const getCmd = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey
    });
    const s3Resp = await s3Client.send(getCmd);
    const fileBuffer = await streamToBuffer(s3Resp.Body as NodeJS.ReadableStream);

    // Attempt text extraction
    let extractedText = '';
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(fileBuffer);
      extractedText = data.text.trim();
    } catch (err) {
      console.error('Error parsing PDF:', err);
    }

    if (!extractedText) {
      console.log('PDF has no text layer - OCR required');
      // TODO: Perform OCR (e.g., Tesseract or AWS Textract) to extract text
      extractedText = '';
    }

    // Detect verse references in the extracted text
    const bookPattern = BIBLE_BOOKS.join('|');
    const verseRegex = new RegExp(`\\b(${bookPattern})\\s+(\\d{1,3})\\s*:\\s*(\\d{1,3})\\b`, 'gi');
    const referencesSet = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = verseRegex.exec(extractedText)) !== null) {
      const book = match[1];
      const chapter = match[2];
      const verse = match[3];
      referencesSet.add(`${book} ${chapter}:${verse}`);
    }
    const references = Array.from(referencesSet);
    console.log('Detected verse references:', references);

    // Fetch verse IDs from the database
    let verseData: Array<{ id: number; book: string; chapter: number; verse: number }>; 
    if (references.length > 0) {
      verseData = await db('bible_verses')
        .whereRaw(`CONCAT(book, ' ', chapter, ':', verse) IN (${references.map(() => '?').join(',')})`, references)
        .select('id', 'book', 'chapter', 'verse');
    } else {
      verseData = [];
    }

    const trx = await db.transaction();
    try {
      const cdnUrl = process.env.CDN_URL || '';
      const fullUrl = pdf_url.startsWith('http') ? pdf_url : `${cdnUrl}${pdf_url}`;
      const [inserted] = await trx('pdfs')
        .insert({
          title,
          author: author || null,
          file_url: fullUrl,
          notebook_lm_url: notebook_lm_url || null,
          summary: summary || null,
          source_url: source_url || null,
          ai_assisted: ai_assisted || false,
          themes,
          uploaded_by,
          created_at: new Date(),
        })
        .returning('id');

      const pdfId = inserted.id;

      if (verseData.length > 0) {
        // Insert into pdf_verses join table
        await trx('pdf_verses').insert(
          verseData.map(v => ({ pdf_id: pdfId, verse_id: v.id }))
        );

        // Update bible_verses tables similar to song submission
        await updateBibleVerses(trx, pdfId, verseData.map(v => v.id), themes, !!ai_assisted);
      }

      await trx.commit();
      return res.status(200).json({ message: 'PDF uploaded successfully', id: pdfId });
    } catch (err) {
      await trx.rollback();
      console.error('Error saving PDF data:', err);
      return res.status(500).json({ message: 'Error saving PDF data' });
    }
  } catch (error) {
    console.error('Unexpected error in PDF upload:', error);
    return res.status(500).json({ message: 'Server error processing PDF' });
  }
}

async function updateBibleVerses(
  trx: Knex.Transaction,
  pdfId: number,
  verseIds: number[],
  themes: string[],
  aiAssisted: boolean
) {
  for (const verseId of verseIds) {
    const updateObj: any = {
      all_pdf_ids: trx.raw('array_append(all_pdf_ids, ?)', [pdfId]),
      ai_content_pdf_ids: aiAssisted ? trx.raw('array_append(ai_content_pdf_ids, ?)', [pdfId]) : trx.raw('ai_content_pdf_ids'),
      human_content_pdf_ids: !aiAssisted ? trx.raw('array_append(human_content_pdf_ids, ?)', [pdfId]) : trx.raw('human_content_pdf_ids'),
    };
    await trx('bible_verses').where('id', verseId).update(updateObj);

    // Update theme_pdf_ids for each theme
    for (const theme of themes) {
      await trx('bible_verses')
        .where('id', verseId)
        .update({
          theme_pdf_ids: trx.raw(`
            jsonb_set(
              COALESCE(theme_pdf_ids, '{}'::jsonb),
              ARRAY[?],
              COALESCE(theme_pdf_ids->?, '[]'::jsonb) || ?::jsonb
            )
          `, [theme, theme, JSON.stringify([pdfId])])
        });
    }
  }
}
