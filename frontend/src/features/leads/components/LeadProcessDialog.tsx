'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, ExternalLink, Search, Target, History, FileText, Copy } from 'lucide-react';
import { ModalShell } from '@/components/common/ModalShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/common/DatePicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeadStatusBadge, LeadPriorityBadge } from './LeadStatusBadge';
import { FollowUpForm } from './FollowUpForm';
import { Lead, LeadActivity, LeadFollowUp } from '../types/lead.types';
import { leadService } from '../services/lead.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { cn, formatDate, formatDateTime, formatLeadCategoryShort } from '@/lib/utils';
import { FollowUpFormValues } from '../schemas/lead.schema';
import { toast } from 'sonner';

interface LeadProcessDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

type ProcessRow = {
  id: string;
  kind: 'activity' | 'followup' | 'initial';
  date: string;
  type: string;
  remark?: string;
  nextFollowUp?: string;
  by?: string;
};

export function LeadProcessDialog({ lead, open, onOpenChange, onRefresh }: LeadProcessDialogProps) {
  const { hasPermission, canViewAllLeads, isReady } = usePermissions();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<{ title: string; remark: string; by: string } | null>(null);
  const [pastInquiries, setPastInquiries] = useState<Lead[]>([]);

  const isClosed = lead ? ['closed', 'booked'].includes(lead.status) : false;
  const canFollowUp = isReady && hasPermission(PERMISSIONS.LEAD_FOLLOWUP_CREATE) && (!isClosed || canViewAllLeads());

  useEffect(() => {
    if (!open || !lead?._id) return;
    setIsLoading(true);
    setSearch('');
    setFilterDate('');
    setPastInquiries([]);
    Promise.all([leadService.getActivities(lead._id), leadService.getFollowUps(lead._id)])
      .then(([act, fu]) => {
        if (act.success) setActivities(act.data || []);
        if (fu.success) setFollowUps(fu.data || []);
      })
      .catch((err: unknown) => {
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 403) {
          toast.error('You no longer have access to this lead');
          onOpenChange(false);
          onRefresh?.();
          return;
        }
        toast.error('Failed to load lead progress');
      })
      .finally(() => setIsLoading(false));

    if (lead?.mobile) {
      leadService.checkMobile(lead.mobile).then((res) => {
        if (res.success && res.data?.closedLeads) {
          const others = res.data.closedLeads.filter((l) => String(l._id) !== String(lead._id));
          setPastInquiries(others);
        }
      }).catch(() => {});
    }
  }, [open, lead?._id, lead?.mobile]);

  const rows = useMemo(() => {
    if (!lead) return [];
    const hasLeadCreatedActivity = activities.some((activity) => activity.type === 'LEAD_CREATED');
    const nonFollowUpActivities = activities.filter((a) => {
      if ((a as { metadata?: { followUpId?: string } }).metadata?.followUpId) return false;
      if (a.type === 'FOLLOW_UP_ADDED') return false;
      if (['CALL_DONE', 'REVISIT_COMPLETED', 'NEGOTIATION_STARTED'].includes(a.type)) return false;
      if (a.title?.startsWith('Follow-up:')) return false;
      return true;
    });

    const followUpItems = followUps.map((f) => {
      const parentName = typeof f.parentActivity === 'object' && f.parentActivity ? f.parentActivity.name : '';
      const childName = typeof f.childActivity === 'object' && f.childActivity ? f.childActivity.name : '';
      const activityLabel = childName || parentName || f.type.replace(/_/g, ' ');
      return {
        id: f._id,
        kind: 'followup' as const,
        date: f.createdAt || f.followUpDate,
        type: activityLabel,
        remark: f.remark,
        nextFollowUp: f.nextFollowUpDate,
        by: f.createdBy?.name,
      };
    });

    const items: ProcessRow[] = [
      ...(lead.initialRemark && !hasLeadCreatedActivity
        ? [{
            id: `${lead._id}-initial-remark`,
            kind: 'initial' as const,
            date: lead.createdAt,
            type: 'Lead Created',
            remark: lead.initialRemark,
            nextFollowUp: lead.nextFollowUpDate,
            by: lead.createdBy?.name,
          }]
        : []),
      ...nonFollowUpActivities.map((a) => ({
        id: a._id,
        kind: 'activity' as const,
        date: a.createdAt,
        type: a.title,
        remark: a.remark,
        by: a.performedBy?.name,
      })),
      ...followUpItems,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items.filter((item) => {
      const matchesSearch =
        !search ||
        [item.type, item.remark, item.by, item.nextFollowUp].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase())
        );
      const matchesDate = !filterDate || item.date.startsWith(filterDate);
      return matchesSearch && matchesDate;
    });
  }, [activities, followUps, search, filterDate, lead]);

  const handleFollowUp = async (data: FollowUpFormValues) => {
    if (!lead) return;
    try {
      await leadService.createFollowUp(lead._id, data);
      toast.success('Follow-up added');
      const [act, fu] = await Promise.all([
        leadService.getActivities(lead._id),
        leadService.getFollowUps(lead._id),
      ]);
      if (act.success) setActivities(act.data || []);
      if (fu.success) setFollowUps(fu.data || []);
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to add follow-up');
      throw err;
    }
  };

  if (!lead) return null;

  return (
    <>
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={lead.customerName}
        description={`Lead ${lead.leadId} · ${formatLeadCategoryShort(lead.category)} · ${lead.mobile}`}
        icon={Target}
        maxWidth="sm:max-w-6xl w-[98vw]"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <LeadPriorityBadge priority={lead.priority} />
            <Badge variant="outline" className="text-[11px]">
              {formatLeadCategoryShort(lead.category)}
            </Badge>
            {lead.assignedTo && (
              <Badge variant="secondary" className="text-[11px]">
                {lead.assignedTo.name}
                {lead.assignedAt ? ` · ${formatDate(lead.assignedAt)}` : ''}
              </Badge>
            )}
          </div>

          {pastInquiries.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/20">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Reused Number — Prior Inquiries for this Mobile ({pastInquiries.length})</span>
              </div>
              <div className="mt-2 space-y-1.5 max-h-[120px] overflow-y-auto">
                {pastInquiries.map((p) => (
                  <div key={p._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-background/90 px-3 py-1.5 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{p.leadId}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{p.customerName}</span>
                      <LeadStatusBadge status={p.status} />
                    </div>
                    <div className="text-[11px] text-muted-foreground max-w-[320px] truncate">
                      {p.lastFollowUpRemark || p.initialRemark || 'No prior discussion recorded'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search remarks, type, user..."
                className="crm-toolbar-input h-9 pl-9 text-sm"
              />
            </div>
            <DatePicker
              value={filterDate}
              onChange={setFilterDate}
              placeholder="Filter date"
              compact
              className="w-[148px]"
            />
            {canFollowUp && (
              <Button
                size="sm"
                className="crm-btn-primary crm-btn-interactive h-9 gap-1.5 rounded-lg"
                onClick={() => setFollowUpOpen(true)}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Follow-Up
              </Button>
            )}
            <Button size="sm" variant="outline" className="crm-btn-interactive h-9 gap-1.5 rounded-lg" asChild>
              <Link href={`/leads/${lead._id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Full Page
              </Link>
            </Button>
          </div>

          <div className="crm-table-wrap min-h-[300px] flex-1 overflow-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-10 text-xs font-semibold uppercase">Date</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">Type</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">Remark / Discussion</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">Next Follow-up</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      {search || filterDate
                        ? 'No records match your filters.'
                        : 'No follow-ups or activities for your current assignment.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={`${row.kind}-${row.id}`} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap py-2.5 text-xs">
                        {formatDateTime(row.date)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={row.kind === 'followup' ? 'default' : 'secondary'}
                            className="text-[10px] capitalize"
                          >
                            {row.kind === 'followup' ? row.type : row.kind === 'initial' ? 'Initial' : 'Activity'}
                          </Badge>
                          {row.kind === 'activity' && (
                            <span className="max-w-[120px] truncate text-xs">{row.type}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'min-w-[260px] max-w-[440px] py-2.5 text-xs',
                          row.remark ? 'cursor-pointer hover:bg-muted/60 transition-colors rounded-md group p-2' : ''
                        )}
                        onClick={() => {
                          if (row.remark) {
                            setSelectedRemark({
                              title: `${row.type} (${formatDateTime(row.date)})`,
                              remark: row.remark,
                              by: row.by || 'System',
                            });
                          }
                        }}
                      >
                        <div className="flex items-start gap-1.5 w-full">
                          <p className="leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] flex-1 text-foreground/90" title={row.remark ? 'Click to copy / expand full remark' : undefined}>
                            {row.remark || '—'}
                          </p>
                          {row.remark && (
                            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-primary mt-0.5" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 text-xs">
                        {row.nextFollowUp ? formatDate(row.nextFollowUp) : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">
                        {row.by || 'System'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Assigned</p>
              <p className="font-medium">{lead.assignedTo?.name || 'Unassigned'}</p>
              <p className="text-[11px] text-muted-foreground">{formatDate(lead.assignedAt)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Next Follow-up</p>
              <p className="font-medium">{formatDate(lead.nextFollowUpDate)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Follow-ups</p>
              <p className="font-medium">{followUps.length}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Activities</p>
              <p className="font-medium">{activities.length}</p>
            </div>
          </div>
        </div>
      </ModalShell>

      <FollowUpForm
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        initialStatus={lead?.status}
        previousRemark={lead?.lastFollowUpRemark || lead?.initialRemark}
        onSubmit={handleFollowUp}
      />

      {selectedRemark && (
        <Dialog open={!!selectedRemark} onOpenChange={(openState) => !openState && setSelectedRemark(null)}>
          <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Discussion & Remark Details
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedRemark.title} · Recorded by {selectedRemark.by}
              </DialogDescription>
            </DialogHeader>
            <div className="my-2 rounded-lg border bg-muted/30 p-3.5 text-sm leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-h-[450px] overflow-y-auto">
              {selectedRemark.remark}
            </div>
            <div className="flex justify-between items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(selectedRemark.remark);
                  toast.success('Remark copied to clipboard');
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Remark
              </Button>
              <Button size="sm" onClick={() => setSelectedRemark(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
