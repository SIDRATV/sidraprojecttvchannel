import { NextResponse } from 'next/server';
import { podcastService } from '@/services/podcasts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q'); // search query
  const limit = Math.min(Number(url.searchParams.get('limit') || '12'), 50);
  const offset = Number(url.searchParams.get('offset') || '0');
  const category = url.searchParams.get('category');
  const type = url.searchParams.get('type'); // 'trending', 'featured'

  try {
    let data;

    if (q) {
      // Search podcasts
      data = await podcastService.searchPodcasts(q, limit);
    } else if (type === 'trending') {
      // Get trending podcasts
      data = await podcastService.getTrendingPodcasts(limit);
    } else if (type === 'featured') {
      // Get featured podcasts
      data = await podcastService.getFeaturedPodcasts(limit);
    } else if (category) {
      // Get podcasts by category
      data = await podcastService.getPodcastsByCategory(category, limit, offset);
    } else {
      // Get all podcasts
      data = await podcastService.getPodcasts(limit, offset);
    }

    return NextResponse.json(data || [], {
      headers: { 'Cache-Control': 'no-cache' }
    });
  } catch (error) {
    console.error('Podcasts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch podcasts' }, { status: 500 });
  }
}
