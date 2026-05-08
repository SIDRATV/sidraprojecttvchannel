import { useCallback, useEffect } from 'react';

export function useNotificationSound() {
  // Do NOT request permission on mount - let usePWAInstall handle this

  const playSound = useCallback(() => {
    try {
      // Try to use Web Audio API for a pleasant notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Simple pleasant "ding" sound - two notes
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      // Set volume
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      // Play the sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Optional: Second note for a "dinging" effect
      setTimeout(() => {
        try {
          const osc2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          osc2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);

          osc2.frequency.value = 1000; // Slightly higher pitch
          osc2.type = 'sine';

          gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          osc2.start(audioContext.currentTime);
          osc2.stop(audioContext.currentTime + 0.2);
        } catch {}
      }, 150);
    } catch (error) {
      // Fallback: Try to play from a file if Web Audio doesn't work
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {});
      } catch {}
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions & { link?: string }) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notifOptions = {
      badge: '/sidra-logo.webp',
      icon: '/sidra-logo.webp',
      tag: 'sidra-notification',
      requireInteraction: false,
      ...options,
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
