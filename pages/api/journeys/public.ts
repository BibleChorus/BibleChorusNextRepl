import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/db';
import jwt from 'jsonwebtoken';
import { PublicJourneyListItem } from '@/types/journey';

function getUserIdFromRequest(req: NextApiRequest): number | null {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentUserId = getUserIdFromRequest(req);
    const { limit = 20, offset = 0 } = req.query;

    const journeys = await db('journey_profiles')
      .join('users', 'journey_profiles.user_id', 'users.id')
      .where('journey_profiles.is_public', true)
      .select(
        'journey_profiles.id',
        'journey_profiles.title',
        'journey_profiles.subtitle',
        'journey_profiles.cover_image_url',
        'journey_profiles.theme_color',
        'journey_profiles.likes_count',
        'journey_profiles.created_at',
        'users.username',
        'users.profile_image_url'
      )
      .orderBy('journey_profiles.likes_count', 'desc')
      .orderBy('journey_profiles.created_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));

    const journeyIds = journeys.map((j: any) => j.id);
    
    const songCounts = await db('journey_season_songs')
      .join('seasons', 'journey_season_songs.season_id', 'seasons.id')
      .join('journey_profiles', 'seasons.user_id', 'journey_profiles.user_id')
      .whereIn('journey_profiles.id', journeyIds)
      .where('seasons.is_visible', true)
      .select('journey_profiles.id as journey_id')
      .count('journey_season_songs.id as count')
      .groupBy('journey_profiles.id');

    const songCountMap = new Map<number, number>();
    for (const sc of songCounts) {
      songCountMap.set(Number(sc.journey_id), Number(sc.count));
    }

    let userLikedJourneyIds: number[] = [];
    if (currentUserId) {
      const userLikes = await db('likes')
        .where({ user_id: currentUserId, likeable_type: 'journey' })
        .whereIn('likeable_id', journeyIds)
        .select('likeable_id');
      userLikedJourneyIds = userLikes.map((l: any) => l.likeable_id);
    }

    const result: (PublicJourneyListItem & { is_liked: boolean })[] = journeys.map((journey: any) => ({
      id: journey.id,
      title: journey.title,
      subtitle: journey.subtitle,
      cover_image_url: journey.cover_image_url,
      theme_color: journey.theme_color,
      likes_count: journey.likes_count || 0,
      song_count: songCountMap.get(journey.id) || 0,
      username: journey.username,
      profile_image_url: journey.profile_image_url,
      created_at: journey.created_at,
      is_liked: userLikedJourneyIds.includes(journey.id),
    }));

    const [{ count: total }] = await db('journey_profiles')
      .where('is_public', true)
      .count('* as count');

    return res.status(200).json({
      journeys: result,
      total: Number(total),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching public journeys:', error);
    return res.status(500).json({ error: 'Failed to fetch public journeys' });
  }
}
