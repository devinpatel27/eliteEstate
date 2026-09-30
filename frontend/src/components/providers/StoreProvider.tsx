'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

/** Rehydrate persisted Zustand stores as early as possible on the client. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useUIStore.persist.rehydrate();
  }, []);

  return children;
}
