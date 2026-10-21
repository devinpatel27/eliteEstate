'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { FollowUpForm } from '@/features/leads/components/FollowUpForm';
import { leadService } from '@/features/leads/services/lead.service';
import { Lead } from '@/features/leads/types/lead.types';
import { Visit } from '../types/visit.types';

export function VisitLeadFollowUp({ visit, onSuccess }: { visit: Visit; onSuccess?: () => void }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { hasPermission } = usePermissions();
  if (!hasPermission(PERMISSIONS.LEAD_FOLLOWUP_CREATE) || ['closed', 'booked', 'closed_won', 'closed_lost'].includes(visit.lead?.status || '')) return null;
  return <>
    <Button type="button" size="sm" variant="outline" disabled={loading} onClick={async () => {
      setLoading(true);
      try {
        const response = await leadService.getById(visit.lead?._id || visit.leadId);
        if (!response.data) throw new Error();
        setLead(response.data); setOpen(true);
      } catch { toast.error('Could not load lead follow-up'); }
      finally { setLoading(false); }
    }}>Follow-up</Button>
    {lead && <FollowUpForm open={open} onOpenChange={setOpen} initialStatus={lead.status} previousRemark={lead.lastFollowUpRemark || lead.initialRemark} onSubmit={async data => {
      await leadService.createFollowUp(lead._id, data);
      onSuccess?.();
      toast.success('Lead follow-up added');
    }} />}
  </>;
}
