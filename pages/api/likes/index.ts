import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { user_id, likeable_type, likeable_id } = req.body

      const [like] = await db('likes').insert({
        user_id,
        likeable_type,
        likeable_id,
      }).returning('*')

      res.status(201).json(like)
    } catch (error) {
      console.error('Error creating like:', error)
      res.status(500).json({ message: 'Error creating like', error })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { user_id, likeable_type, likeable_id } = req.body

      await db('likes')
        .where({ user_id, likeable_type, likeable_id })
        .del()

      res.status(200).json({ message: 'Like removed successfully' })
    } catch (error) {
      console.error('Error removing like:', error)
      res.status(500).json({ message: 'Error removing like', error })
    }
  } else {
    res.setHeader('Allow', ['POST', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}