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
      badge: '/images/logo.png',
      icon: '/images/logo.png',
      tag: 'sidra-notification',
      requireInteraction: false,
      ...options,
    };

    // Use Service Worker registration for better mobile/Android support
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: {
          ...notifOptions,
          data: { link: options?.link || '/' },
        },
      });
    } else if ('serviceWorker' in navigator) {
      // Fallback: wait for SW to be ready
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          ...notifOptions,
          data: { link: options?.link || '/' },
        });
      }).catch(() => {
        // Last resort: direct Notification API (desktop only)
        try { new Notification(title, notifOptions); } catch {}
      });
    } else {
      // No service worker support — fallback to direct API
      try { new Notification(title, notifOptions); } catch {}
    }
  }, []);

  return { playSound, showBrowserNotification };
}
