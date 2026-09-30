'use client';

import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmployeeProfile } from '@/features/employees/components/EmployeeProfile';
import { useEmployee } from '@/features/employees/hooks/useEmployees';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { employee, isLoading, error } = useEmployee(id);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Employee Profile" />
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (error || !employee) {
    return <ErrorState description={error || 'Employee not found'} />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employees">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </Button>
        </Link>
      </div>
      <PageHeader title={employee.name} description={`${employee.employeeId} · ${employee.email}`} />
      <EmployeeProfile employee={employee} />
    </div>
  );
}
