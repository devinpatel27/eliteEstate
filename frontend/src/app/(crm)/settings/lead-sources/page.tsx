'use client';

import { PermissionGuard } from '@/components/common/PermissionGuard';
import { MasterTable } from '@/features/leads/components/MasterTable';
import { PERMISSIONS } from '@/lib/constants';

export default function LeadSourcesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.LEAD_MASTER_MANAGE} redirectTo="/dashboard">
      <MasterTable
        type="lead-sources"
        title="Lead Sources"
        description="Manage configurable lead source options."
      />
    </PermissionGuard>
  );
}
