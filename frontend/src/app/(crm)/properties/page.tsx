'use client';

import dynamic from 'next/dynamic';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { TablePageSkeleton } from '@/components/common/PageSkeletons';
import { PERMISSIONS } from '@/lib/constants';

const PropertyTable = dynamic(
  () =>
    import('@/features/properties/components/PropertyTable').then((m) => ({
      default: m.PropertyTable,
    })),
  { loading: () => <TablePageSkeleton /> }
);

export default function PropertiesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.PROPERTY_READ} redirectTo="/dashboard">
      <PageHeader
        title="Properties"
        description="Manage property listings, website visibility, and inquiries."
      />
      <PropertyTable />
    </PermissionGuard>
  );
}
