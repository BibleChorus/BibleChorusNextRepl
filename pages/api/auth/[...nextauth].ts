import { NextApiRequest, NextApiResponse } from 'next'
import { NextRequest } from 'next/server'
import { handlers } from '@/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { GET, POST } = handlers
  
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host || 'localhost:3000'
  const url = `${protocol}://${host}${req.url}`
  
  const request = new NextRequest(url, {
    method: req.method,
    headers: new Headers(req.headers as HeadersInit),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  })
  
  const handler = req.method === 'GET' ? GET : req.method === 'POST' ? POST : null
  
  if (!handler) {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const response = await handler(request)
  
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  
  res.status(response.status)
  
  const text = await response.text()
  res.send(text)
}
