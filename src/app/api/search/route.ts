import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 1) {
      return Response.json({ results: { videos: [], premiumVideos: [], liveStreams: [], podcasts: [], news: [], partners: [], advertisements: [], votingProjects: [], categories: [] } });
    }

    const pattern = `%${query}%`;

    const [videosRes, liveRes, categoriesRes] = await Promise.allSettled([
      supabase.from('videos').select('id, title, thumbnail_url, video_url').ilike('title', pattern).limit(5),
      supabase.from('live_streams').select('id, title, image, is_live').ilike('title', pattern).limit(5),
      supabase.from('categories').select('id, name, icon').ilike('name', pattern).limit(5),
    ]);

    // TODO: Tables not yet in Supabase schema - will be added after migrations:
    // premium_videos, podcasts, news_articles, partners, advertisements, voting_projects
    let premiumVideos: any[] = [];
    let podcasts: any[] = [];
    let news: any[] = [];
    let partners: any[] = [];
    let advertisements: any[] = [];
    let votingProjects: any[] = [];

    return Response.json({
      results: {
        videos:
          videosRes.status === 'fulfilled'
            ? (videosRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'video' as const,
                thumbnail: v.thumbnail_url,
                href: `/watch/${v.id}`,
              }))
            : [],
        premiumVideos,
        liveStreams:
          liveRes.status === 'fulfilled'
            ? (liveRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'live' as const,
                thumbnail: v.image,
                href: `/live`,
                subtitle: v.is_live ? 'En direct' : 'Hors ligne',
              }))
            : [],
        podcasts,
        news,
        partners,
        advertisements,
        votingProjects,
        categories:
          categoriesRes.status === 'fulfilled'
            ? (categoriesRes.value.data ?? []).map((c: any) => ({
                id: c.id,
                title: c.name,
                type: 'category' as const,
                thumbnail: c.icon,
                href: `/explore?category=${c.id}`,
                subtitle: 'Catégorie',
              }))
            : [],
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return Response.json({ error: 'Search failed' }, { status: 500 });
  }
}
