import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import { getAuthenticatedUserId, withApiAuth } from '@/lib/server-auth';


async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getAuthenticatedUserId(req, res);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const profile = await db('journey_profiles')
      .where({ user_id: userId })
      .first();

    if (!profile) {
      return res.status(200).json({
        hasJourney: false,
        hasContent: false,
        profile: null,
      });
    }

    const seasonCount = await db('seasons')
      .where({ user_id: userId })
      .count('* as count')
      .first();

    const songCount = await db('journey_season_songs')
      .join('seasons', 'journey_season_songs.season_id', 'seasons.id')
      .where('seasons.user_id', userId)
      .count('journey_season_songs.id as count')
      .first();

    const hasContent = Number(seasonCount?.count) > 0 || Number(songCount?.count) > 0;

    return res.status(200).json({
      hasJourney: true,
      hasContent,
      profile: {
        id: profile.id,
        title: profile.title,
        subtitle: profile.subtitle,
        is_public: profile.is_public,
      },
    });
  } catch (error) {
    console.error('Error checking journey:', error);
    return res.status(500).json({ error: 'Failed to check journey status' });
  }
}


export default withApiAuth(handler);
