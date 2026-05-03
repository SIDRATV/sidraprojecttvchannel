import { useQuery } from '@tanstack/react-query';
import { videoService } from '@/services/videos';
import { premiumVideoService } from '@/services/premiumVideos';
import type { VideoWithRelations } from '@/types';

interface DashboardVideos {
  recentVideos: VideoWithRelations[];
  featuredVideos: VideoWithRelations[];
  premiumVideos: any[];
}

async function fetchDashboardVideos(): Promise<DashboardVideos> {
  const [recentVideos, featuredVideos, premiumVideos] = await Promise.all([
    videoService.getVideos(6).catch(() => [] as VideoWithRelations[]),
    videoService.getFeaturedVideos(5).catch(() => [] as VideoWithRelations[]),
    premiumVideoService.getVideos(8).catch(() => [] as any[]),
  ]);
  return {
    recentVideos: recentVideos as VideoWithRelations[],
    featuredVideos: featuredVideos as VideoWithRelations[],
    premiumVideos,
  };
}

export function useDashboardVideos() {
  const query = useQuery<DashboardVideos>({
    queryKey: ['dashboard-videos'],
    queryFn: fetchDashboardVideos,
    staleTime: 2 * 60 * 1000,    // réutilise le cache 2 min sur navigation
    refetchInterval: 60 * 1000,  // rafraîchit en fond chaque minute
    refetchOnWindowFocus: true,
    // Données initiales vides pour éviter l'écran blanc
    placeholderData: {
      recentVideos: [],
      featuredVideos: [],
      premiumVideos: [],
    },
  });

  return {
    recentVideos: query.data?.recentVideos ?? [],
    featuredVideos: query.data?.featuredVideos ?? [],
    premiumVideos: query.data?.premiumVideos ?? [],
    isLoading: query.isLoading && !query.data,
    isFetching: query.isFetching,
  };
}
