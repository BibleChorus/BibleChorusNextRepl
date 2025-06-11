import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { notebook_lm_url, summary, source_url } = req.body;

    if (
      notebook_lm_url &&
      !/^https?:\/\/notebooklm\.google\.com\//.test(notebook_lm_url)
    ) {
      return res.status(400).json({ message: 'Invalid NotebookLM URL' });
    }

    if (source_url && !/^https?:\/\//.test(source_url)) {
      return res.status(400).json({ message: 'Invalid source URL' });
    }

    try {
      const updateData: any = {};
      if (notebook_lm_url !== undefined) updateData.notebook_lm_url = notebook_lm_url;
      if (summary !== undefined) updateData.summary = summary;
      if (source_url !== undefined) updateData.source_url = source_url;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No data provided for update' });
      }

      await db('pdfs').where('id', id).update(updateData);
      res.status(200).json({ message: 'PDF updated successfully' });
    } catch (error) {
      console.error('Error updating PDF:', error);
      res.status(500).json({ message: 'Error updating PDF', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
