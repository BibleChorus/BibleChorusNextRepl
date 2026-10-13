import { withApiAuth } from '@/lib/server-auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/server-auth';
import sendgrid from "@sendgrid/mail";
import db from '@/db';  // Import the database connection

// Define the base URL for your application
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://biblechorus.com';
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { songId, reportText } = req.body;
    const user = await requireUser(req, res);
    const { id: userId, username, email: userEmail } = user;
    if (typeof reportText !== 'string' || !reportText.trim() || reportText.length > 10000) return res.status(400).json({ message: 'Provide a report of at most 10000 characters' });
    const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
    try {
      console.log('Fetching song details...');
      // Fetch the song title from the database
      const song = await db('songs').where('id', songId).first('title');
      
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }
      const songTitle = song.title;
      const songLink = `${BASE_URL}/Songs/${Number(songId)}`;
      console.log('Attempting to send email...');
      const msg = {
        to: "admin@biblechorus.com",
        from: "noreply@biblechorus.com", // Use a verified sender email
        subject: `Report Submitted on Song ID ${Number(songId)}`,
        html: `
          <h1>Song Report</h1>
          <p><strong>Report submitted by:</strong></p>
          <ul>
            <li>User ID: ${escape(userId)}</li>
            <li>Username: ${escape(username)}</li>
            <li>User Email: ${escape(userEmail)}</li>
          </ul>
          <p><strong>Reported Song:</strong></p>
          <ul>
            <li>Song ID: ${escape(songId)}</li>
            <li>Song Title: ${escape(songTitle)}</li>
            <li>Song Link: <a href="${songLink}">${songLink}</a></li>
          </ul>
          <hr>
          <h2>Report Content:</h2>
          <p>${escape(reportText)}</p>
        `,
      };
      if (!process.env.SENDGRID_API_KEY) return res.status(503).json({ message: 'Reporting is temporarily unavailable' });
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
      await sendgrid.send(msg);
      console.log('Email sent successfully');
      res.status(200).json({ message: 'Report sent successfully' });
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).json({ message: 'Error sending report', error: error.toString() });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


export default withApiAuth(handler, { methods: ['POST'], identityFields: ['userId'] });
