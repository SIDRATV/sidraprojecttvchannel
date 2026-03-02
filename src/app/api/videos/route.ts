import { NextResponse } from 'next/server';

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

  try {
    // 1) Search for videos to get IDs
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=${maxResults}&key=${key}`;
    console.log(`Searching YouTube for: ${q}`);
    
    const searchRes = await fetch(searchUrl);
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
    const videosRes = await fetch(videosUrl);
    
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

    console.log(`Successfully fetched ${items.length} videos`);
    return NextResponse.json(items);
  } catch (err: any) {
    console.error('API route error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
