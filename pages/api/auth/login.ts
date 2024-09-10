import type { NextApiRequest, NextApiResponse } from 'next'
import db from '../../../db'
import bcrypt from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  try {
    console.log('Attempting to find user with email:', email)
    const user = await db('users').where({ email }).first()

    if (!user) {
      console.log('User not found')
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    console.log('User found, comparing passwords')
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      console.log('Password is invalid')
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    console.log('Password is valid, login successful')
    const { password_hash, ...userWithoutPassword } = user
    res.status(200).json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error in login process:', error)
    res.status(500).json({ message: 'Error authenticating user' })
  }
}
