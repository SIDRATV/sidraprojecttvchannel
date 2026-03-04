import { NextResponse } from 'next/server';
import { liveService } from '@/services/live';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q'); // search query
  const limit = Math.min(Number(url.searchParams.get('limit') || '12'), 50);
  const offset = Number(url.searchParams.get('offset') || '0');
  const category = url.searchParams.get('category');
  const type = url.searchParams.get('type'); // 'active', 'featured'

  try {
    let data;

    if (q) {
      // Search live streams
      data = await liveService.searchLiveStreams(q, limit);
    } else if (type === 'active') {
      // Get active live streams
      data = await liveService.getActiveLiveStreams(limit);
    } else if (type === 'featured') {
      // Get featured live streams
      data = await liveService.getFeaturedLiveStreams(limit);
    } else if (category) {
      // Get live streams by category
      data = await liveService.getLiveStreamsByCategory(category, limit, offset);
    } else {
      // Get all live streams
      data = await liveService.getLiveStreams(limit, offset);
    }

    return NextResponse.json(data || [], {
      headers: { 'Cache-Control': 'no-cache' }
    });
  } catch (error) {
    console.error('Live API error:', error);
    return NextResponse.json({ error: 'Failed to fetch live streams' }, { status: 500 });
  }
}
