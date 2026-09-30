import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@/lib/constants';

const EMPTY_PERMISSIONS: string[] = [];

export function usePermissions() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isReady = isHydrated || isAuthenticated;
  const permissions = useAuthStore((s) => s.user?.permissions ?? EMPTY_PERMISSIONS);

  const hasPermission = (permission: string): boolean => {
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms: string[]): boolean => {
    if (permissions.includes('*')) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (...perms: string[]): boolean => {
    if (permissions.includes('*')) return true;
    return perms.every((p) => permissions.includes(p));
  };

  const isAdmin = (): boolean => permissions.includes('*');

  const canViewAllLeads = (): boolean =>
    permissions.includes(PERMISSIONS.WILDCARD) || permissions.includes(PERMISSIONS.LEAD_READ);

  return { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, canViewAllLeads, permissions, isReady };
}
