'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TablePageSkeleton } from '@/components/common/PageSkeletons';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

const EmployeeTable = dynamic(
  () =>
    import('@/features/employees/components/EmployeeTable').then((m) => ({
      default: m.EmployeeTable,
    })),
  { loading: () => <TablePageSkeleton /> }
);

const AddEmployeeDialog = dynamic(
  () =>
    import('@/features/employees/components/AddEmployeeDialog').then((m) => ({
      default: m.AddEmployeeDialog,
    })),
  { ssr: false }
);

export default function EmployeesPage() {
  const { hasPermission, isReady } = usePermissions();
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage your team members and their access."
      >
        {isReady && hasPermission(PERMISSIONS.EMPLOYEE_CREATE) && (
          <Button
            className="crm-btn-primary gap-2 rounded-xl px-5"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </PageHeader>

      <EmployeeTable key={refreshKey} onAddClick={() => setAddOpen(true)} />

      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
