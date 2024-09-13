import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { book, chapter } = req.query

    if (!book) {
      return res.status(400).json({ error: 'Book parameter is required' })
    }

    try {
      const client = await pool.connect()
      let query = 'SELECT * FROM bible_verses WHERE book = $1'
      let values: (string | number)[] = [book as string]

      if (chapter) {
        query += ' AND chapter = $2'
        values.push(parseInt(chapter as string, 10))
      }

      query += ' ORDER BY chapter, verse'

      const result = await client.query(query, values)
      client.release()

      res.status(200).json(result.rows)
    } catch (error) {
      console.error('Error fetching Bible verses:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}