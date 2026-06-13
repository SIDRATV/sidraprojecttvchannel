import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 1) {
      return Response.json({ results: { videos: [], premiumVideos: [], liveStreams: [], podcasts: [], news: [], partners: [], advertisements: [], votingProjects: [], categories: [] } });
    }

    const pattern = `%${query}%`;

    const [videosRes, liveRes, podcastRes, newsRes, partnersRes, adsRes, votingRes, categoriesRes] = await Promise.allSettled([
      supabase.from('videos').select('id, title, thumbnail_url, video_url').ilike('title', pattern).limit(5),
      supabase.from('live_streams').select('id, title, image, is_live').ilike('title', pattern).limit(5),
      supabase.from('podcasts').select('id, title, image, creator').ilike('title', pattern).limit(5),
      supabase.from('news_articles').select('id, title, image_url, category').ilike('title', pattern).limit(5),
      supabase.from('partners').select('id, name, logo_url, type').ilike('name', pattern).limit(5),
      supabase.from('advertisements').select('id, title, image_url, target_url').ilike('title', pattern).limit(5),
      supabase.from('voting_projects').select('id, title, image_url, description').ilike('title', pattern).limit(5),
      supabase.from('categories').select('id, name, icon').ilike('name', pattern).limit(5),
    ]);

    // TODO: premium_videos table not in Supabase schema yet. Will be added after table migration is applied.
    let premiumVideos: any[] = [];

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
        podcasts:
          podcastRes.status === 'fulfilled'
            ? (podcastRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'podcast' as const,
                thumbnail: v.image,
                href: `/podcast`,
                subtitle: v.creator,
              }))
            : [],
        news:
          newsRes.status === 'fulfilled'
            ? (newsRes.value.data ?? []).map((v: any) => ({
                id: v.id,
                title: v.title,
                type: 'news' as const,
                thumbnail: v.image_url,
                href: `/explore`,
                subtitle: v.category,
              }))
            : [],
        partners:
          partnersRes.status === 'fulfilled'
            ? (partnersRes.value.data ?? []).map((p: any) => ({
                id: p.id,
                title: p.name,
                type: 'partner' as const,
                thumbnail: p.logo_url,
                href: `/explore?type=partner`,
                subtitle: p.type,
              }))
            : [],
        advertisements:
          adsRes.status === 'fulfilled'
            ? (adsRes.value.data ?? []).map((a: any) => ({
                id: a.id,
                title: a.title,
                type: 'advertisement' as const,
                thumbnail: a.image_url,
                href: a.target_url,
                subtitle: 'Annonce',
              }))
            : [],
        votingProjects:
          votingRes.status === 'fulfilled'
            ? (votingRes.value.data ?? []).map((p: any) => ({
                id: p.id,
                title: p.title,
                type: 'voting_project' as const,
                thumbnail: p.image_url,
                href: `/voting/${p.id}`,
                subtitle: p.description?.slice(0, 50),
              }))
            : [],
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
