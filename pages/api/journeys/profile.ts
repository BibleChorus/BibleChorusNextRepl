import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { auth } from '@/auth';
import { JourneyProfile, UpdateJourneyProfileRequest } from '@/types/journey';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await auth(req, res);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id);

  if (req.method === 'GET') {
    try {
      let profile = await db('journey_profiles')
        .where({ user_id: userId })
        .first();

      if (!profile) {
        const user = await db('users').where({ id: userId }).first();
        [profile] = await db('journey_profiles')
          .insert({
            user_id: userId,
            title: `${user?.username || 'My'}'s Musical Journey`,
          })
          .returning('*');
      }

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error fetching journey profile:', error);
      return res.status(500).json({ error: 'Failed to fetch journey profile' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updates: UpdateJourneyProfileRequest = req.body;

      const allowedFields = [
        'title', 'subtitle', 'bio', 'cover_image_url', 'theme_color',
        'is_public', 'show_song_dates', 'show_play_counts', 'layout_style'
      ];

      const sanitizedUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key as keyof UpdateJourneyProfileRequest] !== undefined) {
          sanitizedUpdates[key] = updates[key as keyof UpdateJourneyProfileRequest];
        }
      }
      sanitizedUpdates.updated_at = db.fn.now();

      let profile = await db('journey_profiles')
        .where({ user_id: userId })
        .first();

      if (!profile) {
        [profile] = await db('journey_profiles')
          .insert({
            user_id: userId,
            ...sanitizedUpdates,
          })
          .returning('*');
      } else {
        [profile] = await db('journey_profiles')
          .where({ user_id: userId })
          .update(sanitizedUpdates)
          .returning('*');
      }

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error updating journey profile:', error);
      return res.status(500).json({ error: 'Failed to update journey profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
