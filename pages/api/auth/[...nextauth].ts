import { NextApiRequest, NextApiResponse } from 'next'
import { NextRequest } from 'next/server'
import { handlers } from '@/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { GET, POST } = handlers
  
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host || 'localhost:3000'
  const url = `${protocol}://${host}${req.url}`
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach(item => headers.append(key, item));
    else if (value !== undefined) headers.set(key, value);
  }
  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (typeof req.body === 'string') body = req.body;
    else if (headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(req.body || {})) {
        for (const item of Array.isArray(value) ? value : [value]) form.append(key, String(item));
      }
      body = form.toString();
    } else body = JSON.stringify(req.body);
  }
  const request = new NextRequest(url, {
    method: req.method,
    headers,
    body,
  })
  
  const handler = req.method === 'GET' ? GET : req.method === 'POST' ? POST : null
  
  if (!handler) {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const response = await handler(request)
  
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') res.setHeader(key, value)
  })
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  
  res.status(response.status)
  
  const text = await response.text()
  res.send(text)
}
