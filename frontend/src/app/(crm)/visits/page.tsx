'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { TablePageSkeleton } from '@/components/common/PageSkeletons';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

const VisitTable = dynamic(
  () => import('@/features/visits/components/VisitTable').then((m) => ({ default: m.VisitTable })),
  { loading: () => <TablePageSkeleton /> }
);

export default function VisitsPage() {
  const { hasPermission, isReady } = usePermissions();
  const canViewAllVisits = isReady && hasPermission(PERMISSIONS.VISIT_READ);

  return (
    <PermissionGuard
      anyPermission={[PERMISSIONS.VISIT_READ, PERMISSIONS.VISIT_READ_ASSIGNED]}
      redirectTo="/dashboard"
    >
      <div>
        <PageHeader
          title="Our Visits"
          description={
            isReady && !canViewAllVisits
              ? 'Visits for leads assigned to you.'
              : 'Manage property visits, site visits, and re-visits from leads.'
          }
        />
        <VisitTable />
      </div>
    </PermissionGuard>
  );
}
