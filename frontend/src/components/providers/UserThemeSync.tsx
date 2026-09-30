'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth.store';
import {
  readUserThemePreference,
  writeUserThemePreference,
  type ThemePreference,
} from '@/lib/theme-preference';

/**
 * Persists light/dark/system per logged-in user so each employee keeps their own preference.
 */
export function UserThemeSync() {
  const userId = useAuthStore((s) => s.user?._id);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { theme, setTheme } = useTheme();
  const loadedForUser = useRef<string | null>(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (!userId) {
      loadedForUser.current = null;
      return;
    }

    if (loadedForUser.current === userId) return;

    const saved = readUserThemePreference(userId);
    skipNextSave.current = true;
    setTheme(saved ?? 'light');

    loadedForUser.current = userId;
  }, [userId, isHydrated, setTheme]);

  useEffect(() => {
    if (!userId || !theme) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    writeUserThemePreference(userId, theme as ThemePreference);
  }, [userId, theme]);

  return null;
}
