import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface YTVideoStats {
  id: string;
  viewCount: number;
  likeCount: number;
  /** Only present for active live streams */
  concurrentViewers?: number;
}

/**
 * GET /api/youtube-stats?ids=id1,id2,id3
 * Returns YouTube statistics (views, likes, concurrent viewers) for up to 50 video IDs.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = url.searchParams.get('ids')?.split(',').filter(Boolean) ?? [];

  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  // Batch up to 50 IDs (YouTube API limit per request)
  const batchIds = ids.slice(0, 50).join(',');

  try {
    const ytUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    ytUrl.searchParams.set('part', 'statistics,liveStreamingDetails');
    ytUrl.searchParams.set('id', batchIds);
    ytUrl.searchParams.set('key', apiKey);

    const res = await fetch(ytUrl.toString(), {
      next: { revalidate: 60 }, // cache 60s server-side
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[youtube-stats] YouTube API error:', err);
      return NextResponse.json({ error: 'YouTube API error' }, { status: 502 });
    }

    const json = await res.json();

    const stats: YTVideoStats[] = (json.items ?? []).map((item: any) => ({
      id: item.id as string,
      viewCount: parseInt(item.statistics?.viewCount ?? '0', 10),
      likeCount: parseInt(item.statistics?.likeCount ?? '0', 10),
      concurrentViewers: item.liveStreamingDetails?.concurrentViewers
        ? parseInt(item.liveStreamingDetails.concurrentViewers, 10)
        : undefined,
    }));

    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch (err) {
    console.error('[youtube-stats] Fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch YouTube stats' }, { status: 500 });
  }
}
