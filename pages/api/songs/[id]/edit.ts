import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const { title, artist, genres, lyrics, lyrics_scripture_adherence } = req.body

    try {
      const updateData: any = {}

      if (title !== undefined) updateData.title = title
      if (artist !== undefined) updateData.artist = artist
      if (genres !== undefined) updateData.genres = genres
      if (lyrics !== undefined) updateData.lyrics = lyrics
      if (lyrics_scripture_adherence !== undefined) updateData.lyrics_scripture_adherence = lyrics_scripture_adherence

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No data provided for update' })
      }

      await db('songs').where('id', id).update(updateData)
      res.status(200).json({ message: 'Song updated successfully' })
    } catch (error) {
      console.error('Error updating song:', error)
      res.status(500).json({ message: 'Error updating song', error: error.message })
    }
  } else {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}