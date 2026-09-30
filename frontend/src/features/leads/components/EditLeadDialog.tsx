'use client';

import { ModalShell } from '@/components/common/ModalShell';
import { Pencil } from 'lucide-react';
import { LeadForm } from './LeadForm';
import { Lead } from '../types/lead.types';

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess?: () => void;
}

export function EditLeadDialog({ open, onOpenChange, lead, onSuccess }: EditLeadDialogProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Lead"
      description={`Update details for ${lead.customerName} (${lead.leadId})`}
      icon={Pencil}
      maxWidth="sm:max-w-3xl"
    >
      <LeadForm
        lead={lead}
        mode="edit"
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
