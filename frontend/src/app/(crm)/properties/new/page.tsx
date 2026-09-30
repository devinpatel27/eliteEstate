'use client';

import dynamic from 'next/dynamic';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { TablePageSkeleton } from '@/components/common/PageSkeletons';
import { PERMISSIONS } from '@/lib/constants';

const PropertyForm = dynamic(
  () => import('@/features/properties/components/PropertyForm').then((m) => ({ default: m.PropertyForm })),
  { ssr: false, loading: () => <TablePageSkeleton /> }
);

export default function NewPropertyPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.PROPERTY_CREATE} redirectTo="/properties">
      <PageHeader title="Add Property" description="Create a new property listing." />
      <PropertyForm />
    </PermissionGuard>
  );
}
