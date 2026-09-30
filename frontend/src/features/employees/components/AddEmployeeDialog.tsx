'use client';

import { ModalShell } from '@/components/common/ModalShell';
import { UserPlus } from 'lucide-react';
import { EmployeeForm } from './EmployeeForm';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add New Employee"
      description="Create an employee account with role and access settings"
      icon={UserPlus}
      maxWidth="sm:max-w-3xl"
    >
      <EmployeeForm
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
