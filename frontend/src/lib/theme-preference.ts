export type ThemePreference = 'light' | 'dark' | 'system';

const PREFIX = 'crm-theme';

export function getUserThemeStorageKey(userId: string) {
  return `${PREFIX}-${userId}`;
}

export function readUserThemePreference(userId: string): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(getUserThemeStorageKey(userId));
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return null;
}

export function writeUserThemePreference(userId: string, theme: ThemePreference) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUserThemeStorageKey(userId), theme);
}
