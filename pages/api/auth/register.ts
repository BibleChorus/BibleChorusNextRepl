import type { NextApiRequest, NextApiResponse } from 'next'
import db from '../../../lib/db'
import bcrypt from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username, email, password } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const [user] = await db('users').insert({
      username,
      email,
      password_hash: hashedPassword,
    }).returning('*')

    res.status(201).json({ user: { id: user.id, username: user.username, email: user.email } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating user' })
  }
}
