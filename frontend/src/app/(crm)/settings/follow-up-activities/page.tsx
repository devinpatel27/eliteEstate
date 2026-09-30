'use client';

import { PermissionGuard } from '@/components/common/PermissionGuard';
import { FollowUpActivityMaster } from '@/features/leads/components/FollowUpActivityMaster';
import { PERMISSIONS } from '@/lib/constants';

export default function FollowUpActivitiesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.LEAD_MASTER_MANAGE} redirectTo="/dashboard">
      <FollowUpActivityMaster />
    </PermissionGuard>
  );
}
