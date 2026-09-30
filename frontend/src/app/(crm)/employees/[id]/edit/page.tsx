'use client';

import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmployeeForm } from '@/features/employees/components/EmployeeForm';
import { useEmployee } from '@/features/employees/hooks/useEmployees';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { employee, isLoading, error } = useEmployee(id);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Edit Employee" />
        <SkeletonTable rows={6} columns={4} />
      </div>
    );
  }

  if (error || !employee) {
    return <ErrorState description={error || 'Employee not found'} />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/employees/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>
      </div>
      <PageHeader title={`Edit: ${employee.name}`} description="Update employee information and settings." />
      <EmployeeForm employee={employee} mode="edit" />
    </div>
  );
}
