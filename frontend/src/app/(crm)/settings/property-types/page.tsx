'use client';

import { PermissionGuard } from '@/components/common/PermissionGuard';
import { MasterTable } from '@/features/leads/components/MasterTable';
import { PERMISSIONS } from '@/lib/constants';

export default function PropertyTypesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.LEAD_MASTER_MANAGE} redirectTo="/dashboard">
      <MasterTable
        type="property-types"
        title="Property Types"
        description="Manage configurable property type options for leads."
      />
    </PermissionGuard>
  );
}
