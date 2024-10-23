import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db'; // Updated import statement

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    const activities = await db
      .select(
        db.raw(
          `
          'song_comment' as type,
          CONCAT('song_comment_', sc.id) as id,
          sc.comment as content,
          sc.created_at,
          json_build_object(
            'song_title', s.title,
            'song_id', s.id,
            'comment_likes', sc.likes,
            'new_replies', (
              SELECT COUNT(*)
              FROM song_comments replies
              WHERE replies.parent_comment_id = sc.id
              AND replies.created_at > COALESCE(
                (SELECT last_login FROM users WHERE id = ?),
                NOW() - INTERVAL '30 days'
              )
            )
          ) as metadata
        `,
          [id]
        )
      )
      .from('song_comments as sc')
      .join('songs as s', 's.id', 'sc.song_id')
      .where('sc.user_id', id)
      .unionAll(function () {
        this.select(
          db.raw(
            `
            'forum_comment' as type,
            CONCAT('forum_comment_', fc.id) as id,
            fc.content,
            fc.created_at,
            json_build_object(
              'topic_title', ft.title,
              'topic_id', ft.id,
              'new_replies', (
                SELECT COUNT(*)
                FROM forum_comments replies
                WHERE replies.parent_comment_id = fc.id
                AND replies.created_at > COALESCE(
                  (SELECT last_login FROM users WHERE id = ?),
                  NOW() - INTERVAL '30 days'
                )
              )
            ) as metadata
          `,
            [id]
          )
        )
          .from('forum_comments as fc')
          .join('forum_topics as ft', 'ft.id', 'fc.topic_id')
          .where('fc.user_id', id);
      })
      .unionAll(function () {
        this.select(
          db.raw(
            `
            'song_upload' as type,
            CONCAT('song_upload_', s.id) as id,
            s.title as content,
            s.created_at,
            json_build_object(
              'song_title', s.title,
              'song_id', s.id
            ) as metadata
          `
          )
        )
          .from('songs as s')
          .where('s.uploaded_by', id);
      })
      .orderBy('created_at', 'desc')
      .limit(50);

    return res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
