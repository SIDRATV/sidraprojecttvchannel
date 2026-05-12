'use client';

import { useState, useEffect, useCallback } from 'react';

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface NotificationPermissionState {
  permission: NotifPermission;
  canRequest: boolean;           // true when API exists and permission is 'default'
  requestPermission: () => Promise<NotifPermission>;
  /** Key stored in localStorage so users can soft-disable even when 'granted' */
  softEnabled: boolean;
  setSoftEnabled: (v: boolean) => void;
}

const LS_KEY = 'notif_soft_enabled';
const LS_PROMPTED_KEY = 'notif_prompted_once';

export function useNotificationPermission(): NotificationPermissionState {
  const [permission, setPermission] = useState<NotifPermission>('unsupported');
  const [softEnabled, setSoftEnabledState] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as NotifPermission);

    // Restore soft preference
    const stored = localStorage.getItem(LS_KEY);
    if (stored !== null) setSoftEnabledState(stored === 'true');
  }, []);

  const requestPermission = useCallback(async (): Promise<NotifPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      const typed = result as NotifPermission;
      setPermission(typed);
      localStorage.setItem(LS_PROMPTED_KEY, 'true');
      if (typed === 'granted') {
        // Default soft-enable when first granted
        localStorage.setItem(LS_KEY, 'true');
        setSoftEnabledState(true);
      }
      return typed;
    } catch {
      return 'denied';
    }
  }, []);

  const setSoftEnabled = useCallback((v: boolean) => {
    localStorage.setItem(LS_KEY, String(v));
    setSoftEnabledState(v);
  }, []);

  const canRequest = permission === 'default';

  return { permission, canRequest, requestPermission, softEnabled, setSoftEnabled };
}

/** Returns true if the user has never been prompted yet */
export function hasBeenPrompted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LS_PROMPTED_KEY) === 'true';
}
