import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const { likeable_type } = req.query;
      let query = db('likes')
        .where('user_id', id)
        .select('likeable_type', 'likeable_id')

      if (likeable_type) {
        query = query.andWhere('likeable_type', likeable_type)
      }

      const likes = await query

      res.status(200).json(likes)
    } catch (error) {
      console.error('Error fetching user likes:', error)
      res.status(500).json({ message: 'Error fetching user likes', error })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
