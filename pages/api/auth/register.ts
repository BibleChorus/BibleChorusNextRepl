import type { NextApiRequest, NextApiResponse } from 'next'
import db from '../../../db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1d' })

    res.status(201).json({ 
      user: { id: user.id, username: user.username, email: user.email },
      token
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating user' })
  }
}
