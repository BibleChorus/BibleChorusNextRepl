import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { commentIds, commentType } = req.query;
    
    console.log('Received commentIds:', commentIds);
    console.log('Received commentType:', commentType);

    if (!commentIds || !commentType) {
      return res.status(400).json({ message: 'Missing commentIds or commentType' });
    }

    if (commentType !== 'forum_comment' && commentType !== 'song_comment') {
      return res.status(400).json({ message: 'Invalid commentType' });
    }

    let idsArray: number[] = [];

    try {
      if (Array.isArray(commentIds)) {
        idsArray = commentIds.flatMap(id => id.split(',').map(Number));
      } else if (typeof commentIds === 'string') {
        idsArray = commentIds.split(',').map(Number);
      }

      idsArray = idsArray.filter(id => !isNaN(id));

      if (idsArray.length === 0) {
        return res.status(200).json({});
      }
    } catch (error) {
      console.error('Error parsing commentIds:', error);
      return res.status(400).json({ message: 'Invalid commentIds provided' });
    }

    console.log('Parsed idsArray:', idsArray);

    try {
      const likeCounts = await db('likes')
        .whereIn('likeable_id', idsArray)
        .andWhere('likeable_type', commentType)
        .select('likeable_id')
        .count('* as count')
        .groupBy('likeable_id');

      console.log('Like counts from DB:', likeCounts);

      const likesData: Record<string, number> = {};
      likeCounts.forEach((item: { likeable_id: number; count: string | number }) => {
        likesData[item.likeable_id.toString()] = Number(item.count);
      });

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
