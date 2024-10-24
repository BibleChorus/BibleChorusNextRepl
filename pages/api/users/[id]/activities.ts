import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Verify the user's authentication (assuming you have a token-based system)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
      if (decoded.userId !== Number(id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // First, get total count
    const countResult = await db.raw(
      `
      SELECT COUNT(*) as count
      FROM (
        SELECT sc.id FROM song_comments sc
        JOIN songs s ON sc.song_id = s.id
        WHERE s.uploaded_by = ?

        UNION ALL

        SELECT fc.id FROM forum_comments fc
        LEFT JOIN forum_topics ft ON fc.topic_id = ft.id
        WHERE ft.user_id = ? OR fc.parent_comment_id IN (
          SELECT id FROM forum_comments WHERE user_id = ?
        )

        UNION ALL

        SELECT l.id FROM likes l
        JOIN songs s ON s.id = l.likeable_id
        WHERE s.uploaded_by = ? AND l.likeable_type = 'song'

        UNION ALL

        SELECT v.id FROM votes v
        JOIN songs s ON s.id = v.song_id
        WHERE s.uploaded_by = ?
      ) as total
    `,
      [id, id, id, id, id]
    );

    // Extract the count from the result
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Then get paginated activities
    const activitiesQuery = db
      .select('*')
      .from(function () {
        this.select(
          db.raw(
            `
            'song_comment' as type,
            CONCAT('song_comment_', sc.id) as id,
            sc.comment as content,
            sc.created_at,
            CASE WHEN sc.user_id = ? THEN false ELSE sc.is_new END as is_new,
            json_build_object(
              'song_title', s.title,
              'song_id', s.id,
              'comment_likes', sc.likes,
              'new_replies', 0
            ) as metadata
          `,
            [id]
          )
        )
          .from('song_comments as sc')
          .join('songs as s', 's.id', 'sc.song_id')
          .where('s.uploaded_by', id)
          .as('activities')
      })
      .unionAll(function () {
        this.select(
          db.raw(
            `
            'forum_comment' as type,
            CONCAT('forum_comment_', fc.id) as id,
            fc.content,
            fc.created_at,
            CASE WHEN fc.user_id = ? THEN false ELSE fc.is_new END as is_new,
            json_build_object(
              'topic_title', ft.title,
              'topic_id', ft.id,
              'new_replies', 0
            ) as metadata
          `,
            [id]
          )
        )
          .from('forum_comments as fc')
          .leftJoin('forum_topics as ft', 'ft.id', 'fc.topic_id')
          .where(function () {
            this.where('ft.user_id', id).orWhereIn('fc.parent_comment_id', function () {
              this.select('id')
                .from('forum_comments')
                .where('user_id', id);
            });
          });
      })
      .unionAll(function () {
        this.select(
          db.raw(
            `
            'song_like' as type,
            CONCAT('song_like_', l.id) as id,
            '' as content,
            l.created_at,
            CASE WHEN l.user_id = ? THEN false ELSE l.is_new END as is_new,
            json_build_object(
              'song_title', s.title,
              'song_id', s.id,
              'liker_username', u.username
            ) as metadata
          `,
            [id]
          )
        )
          .from('likes as l')
          .join('songs as s', function () {
            this.on('s.id', '=', 'l.likeable_id').andOn(
              'l.likeable_type',
              '=',
              db.raw(`'song'`)
            );
          })
          .join('users as u', 'u.id', 'l.user_id')
          .where('s.uploaded_by', id);
      })
      .unionAll(function () {
        this.select(
          db.raw(
            `
            'song_vote' as type,
            CONCAT('song_vote_', v.id) as id,
            '' as content,
            v.created_at,
            CASE WHEN v.user_id = ? THEN false ELSE v.is_new END as is_new,
            json_build_object(
              'song_title', s.title,
              'song_id', s.id,
              'voter_username', u.username,
              'vote_type', v.vote_type,
              'vote_value', v.vote_value
            ) as metadata
          `,
            [id]
          )
        )
          .from('votes as v')
          .join('songs as s', 's.id', 'v.song_id')
          .join('users as u', 'u.id', 'v.user_id')
          .where('s.uploaded_by', id);
      })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Execute the activities query
    const activitiesResult = await activitiesQuery;

    return res.status(200).json({
      activities: activitiesResult,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
