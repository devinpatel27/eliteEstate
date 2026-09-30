'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Shield, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { useRoles } from '../hooks/useRoles';
import { Role } from '../types/role.types';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS, ALL_PERMISSIONS } from '@/lib/constants';
import { formatDate, formatRoleName } from '@/lib/utils';

export function RolesTable() {
  const { roles, isLoading, deleteRole } = useRoles();
  const { hasPermission, isReady } = usePermissions();
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = isReady && hasPermission(PERMISSIONS.ROLE_UPDATE);
  const canDelete = isReady && hasPermission(PERMISSIONS.ROLE_DELETE);

  const getPermissionLabel = (key: string) => {
    const perm = ALL_PERMISSIONS.find((p) => p.key === key);
    return perm?.label || key;
  };

  const groupPermissions = (permissions?: string[]) => {
    const safe = permissions ?? [];
    if (safe.includes('*')) return { 'Full Access': ['All permissions granted'] };

    const grouped: Record<string, string[]> = {};
    safe.forEach((p) => {
      const perm = ALL_PERMISSIONS.find((ap) => ap.key === p);
      if (perm) {
        if (!grouped[perm.group]) grouped[perm.group] = [];
        grouped[perm.group].push(perm.label);
      }
    });
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No roles found"
        description="Create your first role to manage employee permissions."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {roles.filter((role) => role._id).map((role) => {
          const grouped = groupPermissions(role.permissions);
          return (
            <Card key={role._id} className="crm-card p-5 transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {role.isSystem ? (
                      <Lock className="w-4.5 h-4.5 text-primary" />
                    ) : (
                      <Shield className="w-4.5 h-4.5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold capitalize">
                        {formatRoleName(role.roleName)}
                      </h3>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          System
                        </Badge>
                      )}
                      <StatusBadge status={role.status} />
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {formatDate(role.createdAt)}
                      {role.isSystem && (
                        <span className="ml-2 text-primary/80">
                          · System role — edit permissions, cannot delete
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {canEdit && (
                    <Link href={`/roles/${role._id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </Link>
                  )}
                  {canDelete && !role.isSystem && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
                      onClick={() => setDeleteTarget(role)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                {Object.entries(grouped).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      {group}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map((perm) => (
                        <Badge
                          key={perm}
                          variant="outline"
                          className="text-xs font-normal py-0.5"
                        >
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {role.permissions?.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No permissions assigned</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Role"
        description={`Delete role "${formatRoleName(deleteTarget?.roleName)}"? Employees with this role may lose access.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={async () => {
          if (deleteTarget) {
            setIsDeleting(true);
            await deleteRole(deleteTarget._id);
            setIsDeleting(false);
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
