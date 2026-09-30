'use client';

import { useState } from 'react';
import {
  Eye,
  Pencil,
  CalendarClock,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { Lead } from '../types/lead.types';
import { FollowUpForm } from './FollowUpForm';
import { EditLeadDialog } from './EditLeadDialog';
import { LeadProcessDialog } from './LeadProcessDialog';
import { leadService } from '../services/lead.service';
import { FollowUpFormValues } from '../schemas/lead.schema';
import { RowActionButton } from '@/components/common/RowActionButton';
import { toast } from 'sonner';

interface LeadRowActionsProps {
  lead: Lead;
  canEdit: boolean;
  canFollowUp: boolean;
  onRefresh?: () => void;
}

export function LeadRowActions({ lead, canEdit, canFollowUp, onRefresh }: LeadRowActionsProps) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);

  const isClosed = ['closed', 'booked'].includes(lead.status);
  const allowFollowUp = canFollowUp && !isClosed;
  const allowEdit = canEdit && !isClosed;

  const handleFollowUp = async (data: FollowUpFormValues) => {
    try {
      await leadService.createFollowUp(lead._id, data);
      toast.success('Follow-up added');
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to add follow-up');
      throw err;
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {allowFollowUp && (
          <RowActionButton
            icon={CalendarClock}
            label="Add follow-up"
            tone="blue"
            onClick={() => setFollowUpOpen(true)}
          />
        )}
        <RowActionButton
          icon={PhoneCall}
          label="Call customer"
          tone="sky"
          href={`tel:${lead.mobile}`}
        />
        <RowActionButton
          icon={MessageCircle}
          label="WhatsApp"
          tone="green"
          href={`https://wa.me/91${lead.mobile}`}
          external
        />
        <RowActionButton
          icon={Eye}
          label="View progress"
          tone="violet"
          onClick={() => setProcessOpen(true)}
        />
        {allowEdit && (
          <RowActionButton
            icon={Pencil}
            label="Edit lead"
            tone="amber"
            onClick={() => setEditOpen(true)}
          />
        )}
      </div>

      <LeadProcessDialog
        lead={lead}
        open={processOpen}
        onOpenChange={setProcessOpen}
        onRefresh={onRefresh}
      />
      <FollowUpForm
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        initialStatus={lead.status}
        previousRemark={lead.lastFollowUpRemark || lead.initialRemark}
        onSubmit={handleFollowUp}
      />
      {allowEdit && (
        <EditLeadDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          lead={lead}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
