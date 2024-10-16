import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { commentIds } = req.query;
    
    if (!commentIds || (Array.isArray(commentIds) && commentIds.length === 0)) {
      return res.status(200).json({}); // Return an empty object if no commentIds are provided
    }

    let idsArray: number[];
    try {
      idsArray = Array.isArray(commentIds)
        ? commentIds.map(id => parseInt(id as string, 10))
        : [parseInt(commentIds as string, 10)];
      
      idsArray = idsArray.filter(id => !isNaN(id)); // Remove any NaN values
      
      if (idsArray.length === 0) {
        return res.status(200).json({}); // Return an empty object if all IDs were invalid
      }
    } catch (error) {
      console.error('Error parsing commentIds:', error);
      return res.status(400).json({ message: 'Invalid commentIds provided' });
    }

    try {
      const likeCounts = await db('likes')
        .whereIn('likeable_id', idsArray)
        .andWhere('likeable_type', 'forum_comment') // Changed from 'comment' to 'forum_comment'
        .select('likeable_id')
        .count('* as count')
        .groupBy('likeable_id');

      const likesData = likeCounts.reduce((acc: Record<number, number>, { likeable_id, count }) => {
        acc[likeable_id] = Number(count);
        return acc;
      }, {});

      res.status(200).json(likesData);
    } catch (error) {
      console.error('Error fetching likes counts:', error);
      res.status(500).json({ message: 'Error fetching likes counts', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
