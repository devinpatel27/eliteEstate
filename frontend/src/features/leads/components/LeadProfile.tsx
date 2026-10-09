'use client';

import { useState, useEffect } from 'react';
import {
  Pencil, Trash2, ArrowLeftRight, Plus, Phone, Mail, MapPin, Target, Calendar, MessageCircle, Lock, History,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LeadStatusBadge, LeadPriorityBadge } from './LeadStatusBadge';
import { FollowUpForm } from './FollowUpForm';
import { TransferLeadDialog } from './TransferLeadDialog';
import { EditLeadDialog } from './EditLeadDialog';
import { LeadTimeline } from './LeadTimeline';
import { AssignmentHistory } from './AssignmentHistory';
import { Lead, LeadFollowUp } from '../types/lead.types';
import { useLeadDetailData } from '../hooks/useFollowUps';
import { useLeadActions } from '../hooks/useLeads';
import { leadService } from '../services/lead.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS, LEAD_STATUSES } from '@/lib/constants';
import { cn, formatCurrency, formatDate, formatDateTime, formatLeadCategoryShort } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FollowUpFormValues, TransferLeadFormValues } from '../schemas/lead.schema';

interface LeadProfileProps {
  lead: Lead;
  onRefresh: () => void;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 py-2 last:border-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || '—'}</span>
    </div>
  );
}

function getMasterName(item: Lead['propertyType']): string {
  if (!item) return '—';
  return typeof item === 'string' ? item : item.name;
}

export function LeadProfile({ lead, onRefresh }: LeadProfileProps) {
  const router = useRouter();
  const { hasPermission, canViewAllLeads, isReady } = usePermissions();
  const { followUps, activities, assignments, isLoading, refetch, addFollowUp, addNote } = useLeadDetailData(lead._id);
  const { deleteLead, updateStatus, transferLead, isLoading: actionLoading } = useLeadActions();

  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [pastInquiries, setPastInquiries] = useState<Lead[]>([]);

  useEffect(() => {
    if (lead?.mobile) {
      leadService.checkMobile(lead.mobile).then((res) => {
        if (res.success && res.data?.closedLeads) {
          const others = res.data.closedLeads.filter((l) => String(l._id) !== String(lead._id));
          setPastInquiries(others);
        }
      }).catch(() => {});
    }
  }, [lead?._id, lead?.mobile]);

  const isClosedStatus = ['closed', 'booked'].includes(lead.status);
  const isLeadAdminUser = isReady && canViewAllLeads();
  const isLeadLocked = isClosedStatus && !isLeadAdminUser;

  const canEdit = isReady && hasPermission(PERMISSIONS.LEAD_UPDATE) && !isLeadLocked;
  const canDelete = isReady && hasPermission(PERMISSIONS.LEAD_DELETE) && !isLeadLocked;
  const canTransfer = isReady && hasPermission(PERMISSIONS.LEAD_TRANSFER) && !isLeadLocked;
  const canFollowUp = isReady && hasPermission(PERMISSIONS.LEAD_FOLLOWUP_CREATE) && !isLeadLocked;
  const canStatus = isReady && hasPermission(PERMISSIONS.LEAD_STATUS_UPDATE) && (!isClosedStatus || isLeadAdminUser);
  const canNote = isReady && hasPermission(PERMISSIONS.LEAD_NOTE_CREATE) && !isLeadLocked;

  const categoryLabel = formatLeadCategoryShort(lead.category);

  const budgetLabel = (() => {
    const min = formatCurrency(lead.budgetMin);
    const max = formatCurrency(lead.budgetMax);
    if (min === '—' && max === '—') return '—';
    if (min !== '—' && max !== '—') return `${min} – ${max}`;
    return min !== '—' ? min : max;
  })();

  const handleTransfer = async (data: TransferLeadFormValues) => {
    await transferLead(lead._id, data.assignedTo, data.transferRemark, data.sharePreviousRemarks);
    onRefresh();
    refetch();
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote(noteText.trim());
    setNoteText('');
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {isClosedStatus && (
        <div className={cn(
          "flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium border",
          isLeadAdminUser 
            ? "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/20"
            : "bg-destructive/10 text-destructive border-destructive/20"
        )}>
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            {isLeadAdminUser 
              ? `This lead is currently ${lead.status === 'booked' ? 'Booked' : 'Closed'}. As an Admin, you can update its status or edit details to reopen it.`
              : `This lead is currently ${lead.status === 'booked' ? 'Booked' : 'Closed'} and locked. Regular edits, transfers, and follow-ups are restricted until an Admin reopens it.`}
          </span>
        </div>
      )}

      {pastInquiries.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs dark:border-amber-800/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Reused Mobile Number — Prior Inquiries on Record ({pastInquiries.length})</span>
          </div>
          <p className="mt-1 text-muted-foreground text-[11px]">
            This customer mobile number was previously registered under older/closed leads in the CRM:
          </p>
          <div className="mt-2.5 space-y-2 max-h-[160px] overflow-y-auto">
            {pastInquiries.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-background/90 p-2.5 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{p.leadId}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{p.customerName}</span>
                  <LeadStatusBadge status={p.status} />
                  <span className="text-[11px] text-muted-foreground">({formatDate(p.createdAt)})</span>
                </div>
                <div className="text-[11px] text-muted-foreground max-w-[400px] truncate">
                  {p.lastFollowUpRemark || p.initialRemark || 'No prior remark'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card className="crm-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{lead.leadId}</span>
              <LeadStatusBadge status={lead.status} />
              <LeadPriorityBadge priority={lead.priority} />
            </div>
            <h2 className="text-2xl font-bold">{lead.customerName}</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.mobile}</span>
              {lead.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
              {lead.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{lead.city}</span>}
            </div>
            {lead.assignedTo && (
              <p className="mt-2 text-sm">
                Assigned to <span className="font-medium">{lead.assignedTo.name}</span>
                {lead.assignedAt && <span className="text-muted-foreground"> · {formatDateTime(lead.assignedAt)}</span>}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canFollowUp && (
              <Button size="sm" className="crm-btn-primary crm-btn-interactive gap-1.5 rounded-lg" onClick={() => setFollowUpOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Follow-Up
              </Button>
            )}
            <Button size="sm" variant="outline" className="crm-btn-interactive gap-1.5 rounded-lg text-emerald-600" asChild>
              <a href={`https://wa.me/91${lead.mobile}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </Button>
            <Button size="sm" variant="outline" className="crm-btn-interactive gap-1.5 rounded-lg" asChild>
              <a href={`tel:${lead.mobile}`}>
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            </Button>
            {canTransfer && (
              <Button size="sm" variant="outline" className="crm-btn-interactive gap-1.5 rounded-lg" onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer
              </Button>
            )}
            {canEdit && (
              <Button size="sm" variant="outline" className="crm-btn-interactive gap-1.5 rounded-lg" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="outline" className="crm-btn-interactive gap-1.5 rounded-lg text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        </div>

        {canStatus && (
          <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-4">
            <span className="text-xs text-muted-foreground">Update Status:</span>
            <Select
              value={lead.status}
              onValueChange={async (status) => {
                await updateStatus(lead._id, status);
                onRefresh();
                refetch();
              }}
            >
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      <LeadTimeline activities={activities} isLoading={isLoading} title="Lead Progress Timeline" prominent />

      <Card className="crm-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-primary" /> Follow-Up Records
        </h3>
        {followUps.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">No follow-ups recorded.</p>}
        <div className="space-y-3">
          {followUps.map((fu: LeadFollowUp) => (
            <div key={fu._id} className="rounded-xl border border-border/60 p-3 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] capitalize">{fu.type.replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(fu.followUpDate)}</span>
              </div>
              {fu.remark && <p className="mt-1 text-sm">{fu.remark}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{fu.createdBy?.name} · {formatDateTime(fu.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
        <Card className="crm-card flex h-full flex-col p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Lead Information</h3>
          <InfoRow label="Category" value={categoryLabel} />
          <InfoRow label="Property Type" value={getMasterName(lead.propertyType)} />
          <InfoRow label="Lead Source" value={getMasterName(lead.leadSource)} />
          <InfoRow label="Budget" value={budgetLabel} />
          <InfoRow label="Preferred Area" value={lead.preferredArea} />
          <InfoRow label="Next Follow-up" value={formatDate(lead.nextFollowUpDate)} />
          <InfoRow label="Assigned Date" value={formatDate(lead.assignedAt)} />
          {lead.initialRemark && <InfoRow label="Initial Remark" value={lead.initialRemark} />}
        </Card>

        <Card className="crm-card flex h-full flex-col p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" /> Customer Information</h3>
          <InfoRow label="Name" value={lead.customerName} />
          <InfoRow label="Mobile" value={lead.mobile} />
          <InfoRow label="Alternate Mobile" value={lead.alternateMobile} />
          <InfoRow label="Email" value={lead.email} />
          <InfoRow label="City" value={lead.city} />
          <InfoRow label="Address" value={lead.address} />
        </Card>
      </div>

      <AssignmentHistory assignments={assignments} isLoading={isLoading} />

      <Card className="crm-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Notes</h3>
        {canNote && (
          <div className="mb-4 flex gap-2">
            <textarea
              className="crm-input min-h-[60px] flex-1 resize-y px-3 py-2"
              placeholder="Add a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button size="sm" className="crm-btn-primary crm-btn-interactive shrink-0" onClick={handleAddNote} disabled={!noteText.trim()}>
              Add
            </Button>
          </div>
        )}
        <div className="space-y-2">
          {(lead.notes || []).slice().reverse().map((note, i) => (
            <div key={note._id || i} className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm">{note.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {note.createdBy?.name || 'Unknown'} · {formatDateTime(note.createdAt)}
              </p>
            </div>
          ))}
          {(!lead.notes || lead.notes.length === 0) && (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          )}
        </div>
      </Card>

      <FollowUpForm
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        initialStatus={lead.status}
        previousRemark={lead.lastFollowUpRemark || lead.initialRemark}
        onSubmit={async (data: FollowUpFormValues) => {
          await addFollowUp(data);
          onRefresh();
          refetch();
        }}
      />
      {canTransfer && (
        <TransferLeadDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          currentAssigneeId={
            typeof lead.assignedTo === 'object' ? lead.assignedTo?._id : lead.assignedTo
          }
          onSubmit={handleTransfer}
        />
      )}
      {canEdit && (
        <EditLeadDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          lead={lead}
          onSuccess={onRefresh}
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Lead"
        description={`Delete lead ${lead.leadId} (${lead.customerName})? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={async () => {
          await deleteLead(lead._id);
          router.push('/leads');
        }}
      />
    </div>
  );
}
