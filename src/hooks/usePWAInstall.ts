import { useEffect, useState, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPromptRef.current) return;

    try {
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;

      if (outcome === 'accepted') {
        deferredPromptRef.current = null;
        setIsInstallable(false);
        setIsInstalled(true);

        // Request notification permission after app installation
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              // Show welcome notification
              new Notification('Sidra TV installée! 🎉', {
                body: 'Vous recevrez maintenant les notifications en temps réel.',
                badge: '/images/favicon.ico',
                icon: '/images/favicon.ico',
              });
            }
          } catch (error) {
            console.error('Error requesting notification permission:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error installing app:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
}
