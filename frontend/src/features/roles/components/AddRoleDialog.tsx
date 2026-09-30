'use client';

import { ModalShell } from '@/components/common/ModalShell';
import { ShieldCheck } from 'lucide-react';
import { RoleForm } from './RoleForm';

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddRoleDialog({ open, onOpenChange, onSuccess }: AddRoleDialogProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Role"
      description="Define permissions for a new role in the system"
      icon={ShieldCheck}
      maxWidth="sm:max-w-2xl"
    >
      <RoleForm
        mode="create"
        variant="modal"
        onSuccess={() => {
          onOpenChange(false);
          onSuccess?.();
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ModalShell>
  );
}
