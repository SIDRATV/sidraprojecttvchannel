'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = pathname.startsWith('/app');

  // Si on est dans /app, on retourne juste les enfants sans Navigation/Footer wrapper
  if (isAppRoute) {
    // Retourner les enfants sans Navigation/Footer
    // Les enfants (children) incluent Navigation, main, Footer du layout
    // On doit filtrer pour ne garder que la partie main
    return <>{children}</>;
  }

  return <>{children}</>;
}
