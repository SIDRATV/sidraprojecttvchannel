'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,     // données fraîches 5 min par défaut
            refetchInterval: false,        // pas de polling en fond par défaut
            refetchOnWindowFocus: false,   // pas de refetch sur focus par défaut
            refetchOnReconnect: false,     // pas de refetch à la reconnexion
            retry: 1,
            gcTime: 30 * 60 * 1000,       // garde en cache 30 min
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
