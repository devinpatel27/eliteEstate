'use client';

import { ModalShell } from '@/components/common/ModalShell';
import { Target } from 'lucide-react';
import { LeadForm } from './LeadForm';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddLeadDialog({ open, onOpenChange, onSuccess }: AddLeadDialogProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Lead"
      description="Add lead details, assign an employee, and capture customer information"
      icon={Target}
      maxWidth="sm:max-w-3xl"
    >
      <LeadForm
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
