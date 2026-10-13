import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import sanitizeHtml from 'sanitize-html';
import { ApiError, readId, requireUser, withApiAuth } from '@/lib/server-auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const user = await requireUser(req, res);
  const topicId = readId(req.query.id, 'topic ID');
  const { content, parent_comment_id } = req.body;
  if (typeof content !== 'string' || !content.trim() || content.length > 100000) throw new ApiError(400, 'Provide a comment of at most 100000 characters');
  const comment = await db.transaction(async trx => {
    const topic = await trx('forum_topics').where({ id: topicId }).forUpdate().first();
    if (!topic) throw new ApiError(404, 'Topic not found');
    if (topic.is_locked) throw new ApiError(403, 'This conversation is locked');
    if (parent_comment_id) {
      const parent = await trx('forum_comments').where({ id: readId(parent_comment_id), topic_id: topicId }).first();
      if (!parent) throw new ApiError(400, 'Reply must belong to this conversation');
    }
    const [created] = await trx('forum_comments').insert({
      content: sanitizeHtml(content, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']), allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] } }),
      user_id: user.id,
      topic_id: topicId,
      parent_comment_id: parent_comment_id || null,
      created_at: new Date(),
    }).returning('*');
    return created;
  });
  return res.status(201).json({ ...comment, username: user.username });
}

export default withApiAuth(handler, { methods: ['POST'] });
