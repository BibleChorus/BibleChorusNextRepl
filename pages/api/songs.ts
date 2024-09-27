import { NextApiRequest, NextApiResponse } from 'next'
import db from '@/db'

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const songs = await db('songs')
      .select('*')
      .modify(function(queryBuilder) {
        queryBuilder.select(db.raw(`CONCAT('${CDN_URL}', song_art_url) as song_art_url`))
      })
    res.status(200).json(songs)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching songs' })
  }
}