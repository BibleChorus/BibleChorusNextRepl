import type { NextApiRequest, NextApiResponse } from 'next'
import db from '../../../db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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

    console.log('Password is valid, generating JWT token')
    const { password_hash, ...userWithoutPassword } = user
    
    // Generate JWT token
    console.log('JWT_SECRET status:', process.env.JWT_SECRET ? 'Defined' : 'Undefined')
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined')
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is missing' })
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' })

    console.log('Login successful, returning user data and token')
    res.status(200).json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error('Error in login process:', error)
    res.status(500).json({ message: 'Error authenticating user', error: error.message })
  }
}
