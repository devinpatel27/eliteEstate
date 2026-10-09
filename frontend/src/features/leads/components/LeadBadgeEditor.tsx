'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { Lead } from '../types/lead.types';
import { leadService } from '../services/lead.service';
import { LeadPriorityBadge, LeadStatusBadge } from './LeadStatusBadge';

export function LeadBadgeEditor({ lead, kind, onRefresh }: { lead: Lead; kind: 'priority' | 'status'; onRefresh?: () => void }) {
  const [saving, setSaving] = useState(false);
  const valueFromLead = lead[kind];
  const [currentValue, setCurrentValue] = useState(valueFromLead);
  useEffect(() => setCurrentValue(valueFromLead), [lead._id, valueFromLead]);
  const { isReady, hasPermission, canViewAllLeads } = usePermissions();
  const admin = isReady && canViewAllLeads();
  const closed = ['closed', 'booked', 'closed_won', 'closed_lost'].includes(kind === 'status' ? currentValue : lead.status);
  const allowed = isReady && (!closed || admin) && hasPermission(kind === 'priority' ? PERMISSIONS.LEAD_UPDATE : PERMISSIONS.LEAD_STATUS_UPDATE);
  const badge = kind === 'priority' ? <LeadPriorityBadge priority={currentValue} /> : <LeadStatusBadge status={currentValue} />;
  if (!allowed) return badge;
  const options = kind === 'priority' ? ['hot', 'warm', 'cold'] as const : ['open', 'hold', 'booked', 'closed'] as const;
  async function update(value: string) {
    if (value === currentValue) return;
    setSaving(true);
    try {
      if (kind === 'status') await leadService.updateStatus(lead._id, { status: value });
      else await leadService.update(lead._id, { priority: value as 'hot' | 'warm' | 'cold' });
      setCurrentValue(value);
      toast.success(kind === 'status' ? 'Status updated' : 'Priority updated');
      onRefresh?.();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Could not update lead');
    } finally { setSaving(false); }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" disabled={saving} data-row-click-ignore onClick={event => event.stopPropagation()} aria-label={`Change ${kind} for ${lead.customerName}`} className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{badge}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-row-click-ignore onClick={event => event.stopPropagation()}>
        {options.map(value => <DropdownMenuItem key={value} disabled={saving || value === currentValue} onSelect={() => void update(value)} className="capitalize">{value}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
