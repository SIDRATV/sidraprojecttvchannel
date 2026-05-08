import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { invalidateCache } from '@/lib/clientCache';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

async function fetchNotifications(accessToken: string): Promise<NotificationsResponse> {
  const res = await fetch('/api/notifications?limit=10', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export function useNotifications() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token ?? '';

  const query = useQuery<NotificationsResponse>({
    queryKey: ['notifications', accessToken],
    queryFn: () => fetchNotifications(accessToken),
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000,         // 10 min — Realtime handles live updates
    refetchInterval: false,            // no polling — Realtime subscription covers this
    refetchOnWindowFocus: false,       // Realtime couvre les retours d'onglet
  });

  const markAllRead = async () => {
    if (!accessToken || (query.data?.unreadCount ?? 0) === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });
      // Mise à jour optimiste locale
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications', accessToken],
        (old) =>
          old
            ? {
                ...old,
                unreadCount: 0,
                notifications: old.notifications.map((n) => ({ ...n, read: true })),
              }
            : old
      );
      // Invalider aussi le cache clientCache pour cohérence
      invalidateCache('/api/notifications');
    } catch {}
  };

  // Ajouter une notification venue du Realtime sans re-fetch
  const addRealtimeNotification = useCallback((notif: Notification) => {
    queryClient.setQueryData<NotificationsResponse>(
      ['notifications', accessToken],
      (old) =>
        old
          ? {
              unreadCount: old.unreadCount + 1,
              notifications: [notif, ...old.notifications.slice(0, 9)],
            }
          : { unreadCount: 1, notifications: [notif] }
    );
  }, [queryClient, accessToken]);

  const invalidate = useCallback(() =>
    queryClient.invalidateQueries({ queryKey: ['notifications', accessToken] }),
  [queryClient, accessToken]);

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markAllRead,
    addRealtimeNotification,
    invalidate,
  };
}
