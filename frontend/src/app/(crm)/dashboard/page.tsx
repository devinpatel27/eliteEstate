'use client';

import dynamic from 'next/dynamic';
import { usePermissions } from '@/hooks/usePermissions';
import { DashboardPageSkeleton } from '@/components/common/PageSkeletons';

const AdminDashboard = dynamic(
  () =>
    import('@/features/dashboard/components/AdminDashboard').then((m) => ({
      default: m.AdminDashboard,
    })),
  { loading: () => <DashboardPageSkeleton /> }
);

const EmployeeDashboard = dynamic(
  () =>
    import('@/features/dashboard/components/EmployeeDashboard').then((m) => ({
      default: m.EmployeeDashboard,
    })),
  { loading: () => <DashboardPageSkeleton /> }
);

export default function DashboardPage() {
  const { canViewAllLeads, isReady } = usePermissions();

  if (!isReady) {
    return <DashboardPageSkeleton />;
  }

  return canViewAllLeads() ? <AdminDashboard /> : <EmployeeDashboard />;
}
