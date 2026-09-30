'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { EmptyState } from '@/components/common/EmptyState';
import { TablePageSkeleton } from '@/components/common/PageSkeletons';

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Single permission required */
  permission?: string;
  /** Any one of these permissions grants access */
  anyPermission?: string[];
  /** Redirect when denied (default: show empty state) */
  redirectTo?: string;
}

export function PermissionGuard({
  children,
  permission,
  anyPermission,
  redirectTo,
}: PermissionGuardProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, isReady } = usePermissions();

  const allowed = (() => {
    if (!isReady) return false;
    if (anyPermission?.length) return hasAnyPermission(...anyPermission);
    if (permission) return hasPermission(permission);
    return true;
  })();

  useEffect(() => {
    if (isReady && !allowed && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isReady, allowed, redirectTo, router]);

  if (!isReady) {
    return <TablePageSkeleton />;
  }

  if (!allowed) {
    if (redirectTo) return null;
    return (
      <EmptyState
        icon={ShieldOff}
        title="Access denied"
        description="You do not have permission to view this page."
      />
    );
  }

  return <>{children}</>;
}
