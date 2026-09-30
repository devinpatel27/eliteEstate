'use client';

import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { RoleForm } from '@/features/roles/components/RoleForm';
import { useRole } from '@/features/roles/hooks/useRoles';
import { formatRoleName } from '@/lib/utils';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role, isLoading, error } = useRole(id);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Edit Role" />
        <SkeletonTable rows={4} columns={3} />
      </div>
    );
  }

  if (error || !role) {
    return <ErrorState description={error || 'Role not found'} />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/roles">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Roles
          </Button>
        </Link>
      </div>
      <PageHeader
        title={`Edit: ${formatRoleName(role.roleName)}`}
        description="Update role name, description, and permissions."
      />
      <RoleForm role={role} mode="edit" />
    </div>
  );
}
