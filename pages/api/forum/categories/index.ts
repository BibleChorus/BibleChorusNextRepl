import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db'; // Assuming you have a db module for database interactions

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    try {
      // Fetch all forum categories from the database
      const categories = await db('forum_categories').select('*').orderBy('name', 'asc');
      res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Error fetching categories' });
    }
  } else {
    // Method Not Allowed
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
