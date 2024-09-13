import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { books } = req.query

    if (!books) {
      return res.status(400).json({ error: 'Books parameter is required' })
    }

    try {
      const client = await pool.connect()
      const bookList = (books as string).split(',')
      const query = `
        SELECT DISTINCT book, chapter
        FROM bible_verses
        WHERE book = ANY($1::text[])
        ORDER BY book, chapter
      `
      const result = await client.query(query, [bookList])
      client.release()

      const chapters = result.rows.reduce((acc, row) => {
        if (!acc[row.book]) {
          acc[row.book] = []
        }
        acc[row.book].push(row.chapter)
        return acc
      }, {} as Record<string, number[]>)

      res.status(200).json(chapters)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}