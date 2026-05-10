import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
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
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token ?? '';
  // Use stable userId as queryKey — token changes on every refresh but userId never does
  const userId = user?.id ?? '';
  // Keep a ref to the latest token for use inside callbacks (avoids stale closure)
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  // Stable queryKey: ['notifications', userId] — never invalidated by token refresh
  const queryKey = ['notifications', userId];

  const query = useQuery<NotificationsResponse>({
    queryKey,
    queryFn: () => fetchNotifications(tokenRef.current),
    enabled: !!userId && !!accessToken,
    staleTime: 10 * 60 * 1000,         // 10 min — Realtime handles live updates
    refetchInterval: false,            // no polling — Realtime subscription covers this
    refetchOnWindowFocus: false,       // Realtime couvre les retours d'onglet
  });

  const markAllRead = async () => {
    if (!tokenRef.current || (query.data?.unreadCount ?? 0) === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });
      // Mise à jour optimiste locale
      queryClient.setQueryData<NotificationsResponse>(queryKey, (old) =>
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

  // Stable callback — uses queryKey (stable) and queryClient (stable)
  const addRealtimeNotification = useCallback((notif: Notification) => {
    queryClient.setQueryData<NotificationsResponse>(queryKey, (old) =>
      old
        ? {
            unreadCount: old.unreadCount + 1,
            notifications: [notif, ...old.notifications.slice(0, 9)],
          }
        : { unreadCount: 1, notifications: [notif] }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, userId]); // userId stable; queryKey is derived from it

  const invalidate = useCallback(() =>
    queryClient.invalidateQueries({ queryKey }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [queryClient, userId]);

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markAllRead,
    addRealtimeNotification,
    invalidate,
  };
}
