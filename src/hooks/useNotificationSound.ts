import { useCallback, useEffect } from 'react';

export function useNotificationSound() {
  // Do NOT request permission on mount - let usePWAInstall handle this

  const playSound = useCallback(() => {
    // Primary: use the pre-generated WAV file (reliable, no autoplay restrictions after user interaction)
    try {
      const audio = new Audio('/sounds/notification.wav');
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Fallback: Web Audio API oscillator (works even if file fails)
        playWebAudioDing();
      });
      return;
    } catch {}
    // Final fallback: Web Audio API
    playWebAudioDing();
  }, []);

  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions & { link?: string }) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notifOptions = {
      tag: 'sidra-notification',
      requireInteraction: false,
      silent: false,
      ...options,
      // Always override with official PNG icons — WebP is unreliable on Android notifications
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
    };

    // Always go through serviceWorker.ready — more reliable on mobile than
    // checking .controller (which is null on first load / after hard refresh).
    // Timeout of 3s: if SW never activates, fall back to direct Notification API.
    if ('serviceWorker' in navigator) {
      const swReady = navigator.serviceWorker.ready;
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

      Promise.race([swReady, timeout]).then((result) => {
        if (!result) {
          // Timeout — SW not ready, fall back to direct API
          try { new Notification(title, notifOptions); } catch {}
          return;
        }
        const registration = result as ServiceWorkerRegistration;
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options: {
              ...notifOptions,
              vibrate: [200, 100, 200],
              data: { link: options?.link || '/' },
            },
          });
        } else {
          // SW registered but not active — show directly
          registration.showNotification(title, {
            ...notifOptions,
            data: { link: options?.link || '/' },
          }).catch(() => {
            try { new Notification(title, notifOptions); } catch {}
          });
        }
      }).catch(() => {
        try { new Notification(title, notifOptions); } catch {}
      });
    } else {
      try { new Notification(title, notifOptions); } catch {}
    }
  }, []);

  return { playSound, showBrowserNotification };
}

/** Web Audio API two-tone ding — fallback when audio file cannot be played */
function playWebAudioDing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, startAt: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.start(startAt);
      osc.stop(startAt + duration);
    };
    const now = ctx.currentTime;
    playTone(800, now, 0.18, 0.3);
    playTone(1050, now + 0.22, 0.18, 0.22);
  } catch {}
}
