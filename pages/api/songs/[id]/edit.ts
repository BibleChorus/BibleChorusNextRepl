import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const { title, artist, genres } = req.body

    try {
      await db('songs').where('id', id).update({
        title,
        artist,
        genres // This assumes your database column for genres is an array type
      })
      res.status(200).json({ message: 'Song updated successfully' })
    } catch (error) {
      console.error('Error updating song:', error)
      res.status(500).json({ message: 'Error updating song', error })
    }
  } else {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}