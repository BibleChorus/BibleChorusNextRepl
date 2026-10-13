import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { ApiError, requireUser, withApiAuth } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const match = typeof req.query.id === 'string' && req.query.id.match(/^(song[-_]comment|forum[-_]comment|song[-_]upload|song[-_]like|song[-_]vote)_(\d+)$/);
  if (!match) throw new ApiError(400, 'Invalid activity ID');
  const [, rawType, id] = match;
  const type = rawType.replace('-', '_');
  let table: string;
  let allowed = false;
  if (type === 'song_upload') {
    table = 'songs';
    allowed = !!(await db(table).where({ id, uploaded_by: user.id }).first());
  } else if (type === 'song_like' || type === 'song_vote') {
    table = type === 'song_like' ? 'likes' : 'votes';
    const activity = await db(table).where({ id }).first();
    if (activity && (type !== 'song_like' || activity.likeable_type === 'song')) {
      allowed = !!(await db('songs').where({ id: activity.song_id || activity.likeable_id, uploaded_by: user.id }).first());
    }
  } else {
    table = type === 'song_comment' ? 'song_comments' : 'forum_comments';
    const comment = await db(table).where({ id }).first();
    if (comment) {
      const resource = type === 'song_comment' ? 'songs' : 'forum_topics';
      const ownerField = type === 'song_comment' ? 'uploaded_by' : 'user_id';
      allowed = !!(await db(resource).where({ id: comment.song_id || comment.topic_id, [ownerField]: user.id }).first());
      if (!allowed && comment.parent_comment_id) {
        allowed = !!(await db(table).where({ id: comment.parent_comment_id, user_id: user.id }).first());
      }
    }
  }
  if (!allowed) throw new ApiError(403, 'You can only mark your own activity as read');
  await db(table).where({ id }).update({ is_new: false });
  return res.status(200).json({ message: 'Activity marked as read' });
}

export default withApiAuth(handler, { methods: ['POST'] });
