'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LEAD_VISIT_CHANGED } from '@/lib/lead-visit-sync';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 120_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
        },
      })
  );

  useEffect(() => {
    const sync = () => {
      // These views cache the same lead status and visit activity data.
      const families = new Set(['leads', 'lead', 'visits', 'dashboard', 'dashboard-overview', 'employee-performance', 'employee-lead-stream', 'lead-follow-up-journey']);
      void queryClient.invalidateQueries({ predicate: query => families.has(String(query.queryKey[0])), refetchType: 'all' });
    };
    window.addEventListener(LEAD_VISIT_CHANGED, sync);
    return () => window.removeEventListener(LEAD_VISIT_CHANGED, sync);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
