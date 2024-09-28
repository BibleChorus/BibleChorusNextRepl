import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const likeCounts = await db('likes')
        .where('likeable_type', 'song')
        .select('likeable_id')
        .count('* as count')
        .groupBy('likeable_id')

      const result = likeCounts.reduce((acc, { likeable_id, count }) => {
        acc[likeable_id] = Number(count)
        return acc
      }, {} as Record<number, number>)

      res.status(200).json(result)
    } catch (error) {
      console.error('Error fetching like counts:', error)
      res.status(500).json({ message: 'Error fetching like counts', error })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}