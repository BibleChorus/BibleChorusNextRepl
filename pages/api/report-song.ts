import { NextApiRequest, NextApiResponse } from 'next';
import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { songId, userId, username, userEmail, reportText } = req.body;

    try {
      console.log('Attempting to send email...');
      const msg = {
        to: "admin@biblechorus.com",
        from: "noreply@biblechorus.com", // Use a verified sender email
        subject: `Report Submitted on Song ID ${songId}`,
        html: `
          <h1>Song Report</h1>
          <p><strong>Report submitted by:</strong></p>
          <ul>
            <li>User ID: ${userId}</li>
            <li>Username: ${username}</li>
            <li>User Email: ${userEmail}</li>
          </ul>
          <hr>
          <h2>Report Content:</h2>
          <p>${reportText}</p>
        `,
      };

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
