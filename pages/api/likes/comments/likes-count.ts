import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { commentIds } = req.query;
    
    console.log('Received commentIds:', commentIds);

    if (!commentIds) {
      return res.status(200).json({}); // Return an empty object if no commentIds are provided
    }

    let idsArray: number[] = [];

    try {
      if (Array.isArray(commentIds)) {
        // If commentIds is an array of strings
        idsArray = commentIds.flatMap(id => id.split(',').map(Number));
      } else if (typeof commentIds === 'string') {
        // If commentIds is a comma-separated string
        idsArray = commentIds.split(',').map(Number);
      }

      idsArray = idsArray.filter(id => !isNaN(id)); // Remove any NaN values

      if (idsArray.length === 0) {
        return res.status(200).json({}); // Return an empty object if all IDs were invalid
      }
    } catch (error) {
      console.error('Error parsing commentIds:', error);
      return res.status(400).json({ message: 'Invalid commentIds provided' });
    }

    console.log('Parsed idsArray:', idsArray);

    try {
      const likeCounts = await db('likes')
        .whereIn('likeable_id', idsArray)
        .andWhere('likeable_type', 'forum_comment')
        .select('likeable_id')
        .count('* as count')
        .groupBy('likeable_id');

      console.log('Like counts from DB:', likeCounts);

      const likesData: Record<string, number> = {};
      likeCounts.forEach((item: { likeable_id: number; count: string | number }) => {
        likesData[item.likeable_id.toString()] = Number(item.count);
      });

      // Ensure all requested IDs are in the response, even if they have no likes
      idsArray.forEach(id => {
        if (!(id.toString() in likesData)) {
          likesData[id.toString()] = 0;
        }
      });

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
