import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_COOKIE } from '@/lib/constants';

export interface AuthUser {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  permissions: string[];
  profileImage?: string;
  forcePasswordChange?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, token) => {
        if (typeof document !== 'undefined') {
          document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        set({
          user: { ...user, permissions: user.permissions ?? [] },
          token,
          isAuthenticated: true,
          isHydrated: true,
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...updates,
                permissions: updates.permissions ?? state.user.permissions ?? [],
              }
            : null,
        }));
      },

      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'crm-auth',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        if (state?.token && typeof document !== 'undefined') {
          document.cookie = `${AUTH_COOKIE}=${state.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
      },
    }
  )
);
