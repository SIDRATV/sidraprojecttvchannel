import { NextResponse } from 'next/server';
import { videosCache } from '@/lib/cache';

// Force dynamic execution - do NOT cache at build time
export const dynamic = 'force-dynamic';

function parseISODuration(iso: string | undefined) {
  if (!iso) return undefined;
  // Simple ISO 8601 duration parser (PT#H#M#S)
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const [, h, m, s] = match;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s) parts.push(`${s}s`);
  return parts.join(' ') || undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || 'technology';
  const maxResults = Math.min(Number(url.searchParams.get('max') || '12'), 50);
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    console.error('YOUTUBE_API_KEY is not set in environment variables');
    return NextResponse.json({ 
      error: 'Missing YouTube API key. Set YOUTUBE_API_KEY in .env.local' 
    }, { status: 500 });
  }

  // DEBUG: Log environment info
  console.log('API KEY DEBUG:', {
    keyExists: !!key,
    keyLength: key?.length,
    keyPrefix: key?.substring(0, 10),
    environment: process.env.NODE_ENV,
    platform: process.platform,
  });

  try {
    // Check cache first
    const cacheKey = `${q}:${maxResults}`;
    const cachedVideos = videosCache.get(cacheKey);
    
    if (cachedVideos) {
      console.log(`✓ Cache hit for query: ${q} (${cachedVideos.length} videos)`);
      return NextResponse.json(cachedVideos, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    console.log(`🔍 Cache miss for query: ${q} - fetching from YouTube API`);

    // 1) Search for videos to get IDs
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=${maxResults}&key=${key}`;
    
    // Cache YouTube API response for 9 hours (32400 seconds)
    const searchRes = await fetch(searchUrl, { next: { revalidate: 32400 } });
    if (!searchRes.ok) {
      const errorData = await searchRes.json();
      console.error('YouTube Search API error:', errorData);
      return NextResponse.json({ error: `YouTube API error: ${errorData.error?.message || 'Unknown error'}` }, { status: 502 });
    }
    
    const searchData = await searchRes.json();
    const ids = (searchData.items || []).map((it: any) => it.id?.videoId).filter(Boolean);

    if (ids.length === 0) {
      console.warn(`No videos found for query: ${q}`);
      return NextResponse.json([]);
    }

    // 2) Get video details for the found IDs
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids.join(',')}&key=${key}`;
    // Cache YouTube API response for 9 hours (32400 seconds)
    const videosRes = await fetch(videosUrl, { next: { revalidate: 32400 } });
    
    if (!videosRes.ok) {
      const errorData = await videosRes.json();
      console.error('YouTube Videos API error:', errorData);
      return NextResponse.json({ error: `YouTube API error: ${errorData.error?.message || 'Unknown error'}` }, { status: 502 });
    }
    
    const videosData = await videosRes.json();

    const items = (videosData.items || []).map((v: any) => ({
      id: v.id,
      title: v.snippet?.title,
      description: v.snippet?.description,
      image:
        v.snippet?.thumbnails?.maxres?.url || v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || '',
      duration: parseISODuration(v.contentDetails?.duration),
      url: `https://www.youtube.com/watch?v=${v.id}`,
      views: v.statistics?.viewCount,
      publishedAt: v.snippet?.publishedAt,
    }));

    // Store in cache for 10 hours
    videosCache.set(cacheKey, items);
    console.log(`✓ Cached ${items.length} videos for query: ${q}`);

    return NextResponse.json(items, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (err: any) {
    console.error('API route error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
