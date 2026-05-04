'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,     // données fraîches 2 min
            refetchInterval: false,        // pas de polling en fond par défaut
            refetchOnWindowFocus: false,   // pas de refetch sur focus par défaut
            retry: 1,
            gcTime: 5 * 60 * 1000,        // garde en cache 5 min
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
