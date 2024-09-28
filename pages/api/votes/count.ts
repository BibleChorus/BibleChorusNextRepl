import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const voteCounts = await db('votes')
        .select('song_id', 'vote_type')
        .sum('vote_value as count')
        .groupBy('song_id', 'vote_type')

      const result = voteCounts.reduce((acc, { song_id, vote_type, count }) => {
        if (!acc[song_id]) {
          acc[song_id] = {};
        }
        acc[song_id][vote_type] = Number(count);
        return acc;
      }, {} as Record<number, Record<string, number>>);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching vote counts:', error);
      res.status(500).json({ message: 'Error fetching vote counts', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}