'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PWAUpdateState {
  updateAvailable: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  isUpdating: boolean;
  applyUpdate: () => void;
}

/**
 * Detects when a new Service Worker is waiting and exposes an `applyUpdate`
 * function that sends SKIP_WAITING → triggers the browser to swap in the new SW
 * and reloads the page.  Also compares /build-info.json version with the cached
 * version stored in localStorage so we can show an update prompt even when the
 * SW has already been swapped but the user hasn't reloaded.
 */
export function usePWAUpdate(): PWAUpdateState {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // ── Read currently installed version from localStorage
    const storedVersion = localStorage.getItem('app_version');
    setCurrentVersion(storedVersion);

    // ── Fetch latest version from server (cache-busted)
    fetch(`/build-info.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { version?: string }) => {
        const latest = data.version ?? null;
        setLatestVersion(latest);
        if (latest && storedVersion && latest !== storedVersion) {
          setUpdateAvailable(true);
        }
        // If no stored version yet, store it now
        if (latest && !storedVersion) {
          localStorage.setItem('app_version', latest);
          setCurrentVersion(latest);
        }
      })
      .catch(() => {});

    // ── Service Worker "waiting" detection
    navigator.serviceWorker.ready.then((registration) => {
      const checkWaiting = (sw: ServiceWorker) => {
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed') {
            setWaitingWorker(sw);
            setUpdateAvailable(true);
          }
        });
        if (sw.state === 'installed') {
          setWaitingWorker(sw);
          setUpdateAvailable(true);
        }
      };

      if (registration.waiting) checkWaiting(registration.waiting);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) checkWaiting(newWorker);
      });
    });

    // ── When controller changes (SW swapped) → reload to get fresh assets
    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    setIsUpdating(true);
    if (waitingWorker) {
      // Tell the waiting SW to skip its waiting phase
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // controllerchange handler above will reload
    } else {
      // No SW waiting — just bump the stored version and reload
      if (latestVersion) localStorage.setItem('app_version', latestVersion);
      window.location.reload();
    }
  }, [waitingWorker, latestVersion]);

  return { updateAvailable, currentVersion, latestVersion, isUpdating, applyUpdate };
}
