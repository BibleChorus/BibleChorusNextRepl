import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { user_id, song_id, vote_type } = req.query

      const vote = await db('votes')
        .where({ user_id, song_id, vote_type })
        .first()

      res.status(200).json(vote || null)
    } catch (error) {
      console.error('Error fetching vote:', error)
      res.status(500).json({ message: 'Error fetching vote', error })
    }
  } else if (req.method === 'POST') {
    try {
      const { user_id, song_id, vote_type, vote_value } = req.body

      // Check if a vote already exists
      const existingVote = await db('votes')
        .where({ user_id, song_id, vote_type })
        .first()

      if (existingVote) {
        // Update existing vote
        await db('votes')
          .where({ user_id, song_id, vote_type })
          .update({ vote_value, created_at: db.fn.now() })
      } else {
        // Insert new vote
        await db('votes').insert({
          user_id,
          song_id,
          vote_type,
          vote_value,
        })
      }

      res.status(200).json({ message: 'Vote submitted successfully' })
    } catch (error) {
      console.error('Error submitting vote:', error)
      res.status(500).json({ message: 'Error submitting vote', error })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}