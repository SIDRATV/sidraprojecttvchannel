import { useCallback, useEffect } from 'react';

export function useNotificationSound() {
  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

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

  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          badge: '/images/logo.png',
          icon: '/images/logo.png',
          tag: 'sidra-notification',
          requireInteraction: false,
          ...options,
        });
      } catch (error) {
        // Silently fail
      }
    }
  }, []);

  return { playSound, showBrowserNotification };
}
