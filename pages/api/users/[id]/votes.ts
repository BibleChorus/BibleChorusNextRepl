import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const votes = await db('votes')
        .where('user_id', id)
        .select('song_id', 'vote_type', 'vote_value')

      res.status(200).json(votes)
    } catch (error) {
      console.error('Error fetching user votes:', error)
      res.status(500).json({ message: 'Error fetching user votes', error })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}