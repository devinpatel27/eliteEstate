'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Plus, Download, Target, X, CheckSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadListToolbar } from './LeadListToolbar';
import { LeadProcessDialog } from './LeadProcessDialog';
import { useLeadList } from '../hooks/useLeads';
import { getLeadColumns } from './columns';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/lib/constants';
import { downloadCSV, formatDate, formatLeadPriority, formatLeadStatus, formatLeadCategoryShort } from '@/lib/utils';
import { Lead, LeadListParams } from '../types/lead.types';
import { leadService } from '../services/lead.service';

interface LeadTableProps {
  onCreateLead?: () => void;
}

function buildLeadQueryString(params: Pick<LeadListParams, 'followUpDue' | 'status' | 'priority' | 'nfdFrom' | 'nfdTo'>) {
  const q = new URLSearchParams();
  if (params.followUpDue) q.set('followUpDue', params.followUpDue);
  if (params.status && params.status !== 'open') q.set('status', params.status);
  if (params.priority) q.set('priority', params.priority);
  if (params.nfdFrom) q.set('nfdFrom', params.nfdFrom);
  if (params.nfdTo) q.set('nfdTo', params.nfdTo);
  return q.toString();
}

export function LeadTable({ onCreateLead }: LeadTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission, canViewAllLeads, isReady } = usePermissions();
  const initialFollowUpDue = searchParams.get('followUpDue') as 'today' | 'tomorrow' | 'overdue' | null;
  const initialStatus = searchParams.get('status') || 'open';
  const initialPriority = searchParams.get('priority') || undefined;
  const initialNfdFrom = searchParams.get('nfdFrom') || undefined;
  const initialNfdTo = searchParams.get('nfdTo') || undefined;
  const { leads, totalCount, pageCount, isLoading, params, updateParams, refetch } = useLeadList({
    followUpDue: initialFollowUpDue || undefined,
    status: initialStatus,
    priority: initialPriority,
    nfdFrom: initialNfdFrom,
    nfdTo: initialNfdTo,
  });
  const [searchInput, setSearchInput] = useState(params.search || '');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [processOpen, setProcessOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkStatus, setBulkStatus] = useState<string>('closed');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);

  const selectedLeadIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((k) => leads[parseInt(k)]?._id)
      .filter(Boolean);
  }, [rowSelection, leads]);

  const handleBulkUpdateStatus = async (statusToSet: string) => {
    if (selectedLeadIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await leadService.bulkUpdateStatus(selectedLeadIds, statusToSet);
      if (res.success) {
        toast.success(`Updated ${res.data?.modifiedCount ?? selectedLeadIds.length} lead(s) to ${formatLeadStatus(statusToSet)}`);
        setRowSelection({});
        refetch();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to update leads status');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const syncUrl = useCallback(
    (next: Pick<LeadListParams, 'followUpDue' | 'status' | 'priority' | 'nfdFrom' | 'nfdTo'>) => {
      const qs = buildLeadQueryString(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const applyFilters = useCallback(
    (updates: Partial<LeadListParams>) => {
      updateParams(updates);
      const next = {
        followUpDue: updates.followUpDue !== undefined ? updates.followUpDue : params.followUpDue,
        status: updates.status !== undefined ? updates.status : params.status,
        priority: updates.priority !== undefined ? updates.priority : params.priority,
        nfdFrom: updates.nfdFrom !== undefined ? updates.nfdFrom : params.nfdFrom,
        nfdTo: updates.nfdTo !== undefined ? updates.nfdTo : params.nfdTo,
      };
      if (
        updates.followUpDue !== undefined ||
        updates.status !== undefined ||
        updates.priority !== undefined ||
        updates.nfdFrom !== undefined ||
        updates.nfdTo !== undefined
      ) {
        syncUrl(next);
      }
    },
    [updateParams, params.followUpDue, params.status, params.priority, params.nfdFrom, params.nfdTo, syncUrl]
  );

  useEffect(() => {
    const followUpDue = searchParams.get('followUpDue') as 'today' | 'tomorrow' | 'overdue' | null;
    const status = searchParams.get('status') || 'open';
    const priority = searchParams.get('priority') || undefined;
    const nfdFrom = searchParams.get('nfdFrom') || undefined;
    const nfdTo = searchParams.get('nfdTo') || undefined;

    updateParams({
      followUpDue: followUpDue || undefined,
      status,
      priority,
      nfdFrom,
      nfdTo,
      page: 1,
    });
  }, [searchParams, updateParams]);

  useEffect(() => {
    const nextSearch = debouncedSearch || undefined;
    if (nextSearch === (params.search || undefined)) return;
    updateParams({ search: nextSearch, page: 1 });
  }, [debouncedSearch, params.search, updateParams]);

  const canEdit = isReady && hasPermission(PERMISSIONS.LEAD_UPDATE);
  const canCreate = isReady && hasPermission(PERMISSIONS.LEAD_CREATE);
  const canFollowUp = isReady && hasPermission(PERMISSIONS.LEAD_FOLLOWUP_CREATE);

  const handleExportCSV = () => {
    const headers = ['Lead ID', 'Customer', 'Mobile', 'Category', 'Priority', 'Status', 'Next Follow-up', 'Assignment', 'Last Discussed'];
    const rows = leads.map((l: Lead) => {
      return [
        l.leadId,
        l.customerName,
        l.mobile,
        formatLeadCategoryShort(l.category),
        formatLeadPriority(l.priority),
        formatLeadStatus(l.status),
        formatDate(l.nextFollowUpDate),
        l.assignedTo?.name || 'Unassigned',
        l.lastFollowUpRemark || '',
      ];
    });
    downloadCSV([headers, ...rows].map((r) => r.join(',')).join('\n'), `leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const clearFilters = () => {
    updateParams({
      followUpDue: undefined,
      status: 'open',
      priority: undefined,
      category: undefined,
      propertyConfiguration: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      nfdFrom: undefined,
      nfdTo: undefined,
      page: 1,
    });
    router.replace(pathname, { scroll: false });
  };

  const hasActiveFilter = Boolean(
    params.followUpDue ||
    (params.status && params.status !== 'open') ||
    params.priority ||
    params.category ||
    params.propertyConfiguration ||
    params.dateFrom ||
    params.dateTo ||
    params.nfdFrom ||
    params.nfdTo
  );

  const columns = getLeadColumns({
    canEdit,
    canFollowUp,
    canViewAllLeads: canViewAllLeads(),
    onRefresh: refetch,
    onRemarkClick: (lead) => {
      setSelectedLead(lead);
      setProcessOpen(true);
    },
  });

  const toolbar = (
    <LeadListToolbar
      params={params}
      searchInput={searchInput}
      onSearchChange={setSearchInput}
      onParamsChange={applyFilters}
    />
  );

  const toolbarActions = (
    <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 cursor-pointer gap-1.5 rounded-lg border-border/80 px-3">
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  );

  return (
    <div className="space-y-3">
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active filters</span>
          {params.status && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Status: {formatLeadStatus(params.status)}
            </Badge>
          )}
          {params.priority && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Priority: {formatLeadPriority(params.priority)}
            </Badge>
          )}
          {params.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {formatLeadCategoryShort(params.category)}
            </Badge>
          )}
          {params.propertyConfiguration && (
            <Badge variant="secondary" className="gap-1">
              Property: {params.propertyConfiguration}
            </Badge>
          )}
          {params.followUpDue && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Schedule: {params.followUpDue === 'overdue' ? 'Due' : params.followUpDue}
            </Badge>
          )}
          {(params.dateFrom || params.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Created: {params.dateFrom ? formatDate(params.dateFrom) : '…'} → {params.dateTo ? formatDate(params.dateTo) : '…'}
            </Badge>
          )}
          {(params.nfdFrom || params.nfdTo) && (
            <Badge variant="secondary" className="gap-1">
              NFD: {params.nfdFrom ? formatDate(params.nfdFrom) : '...'} - {params.nfdTo ? formatDate(params.nfdTo) : '...'}
            </Badge>
          )}
          <Badge variant="outline" className="tabular-nums">
            {totalCount} result{totalCount !== 1 ? 's' : ''}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 text-xs"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}

      {selectedLeadIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-9 w-[130px] bg-background text-xs font-medium">
                <SelectValue placeholder="New Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="default"
              disabled={isBulkUpdating}
              onClick={() => handleBulkUpdateStatus(bulkStatus)}
              className="h-9 gap-1.5 rounded-lg text-xs font-semibold"
            >
              {isBulkUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update Status
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isBulkUpdating}
              onClick={() => handleBulkUpdateStatus('closed')}
              className="h-9 gap-1.5 rounded-lg border-rose-300 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
            >
              Close Selected
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={isBulkUpdating}
              onClick={() => setRowSelection({})}
              className="h-9 text-xs text-muted-foreground"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={leads}
        totalCount={totalCount}
        pageIndex={(params.page ?? 1) - 1}
        pageSize={params.limit ?? 10}
        pageCount={pageCount}
        enableRowSelection
        selectedRows={rowSelection}
        onSelectionChange={setRowSelection}
        onPageChange={(p) => updateParams({ page: p + 1 })}
        onPageSizeChange={(s) => updateParams({ limit: s, page: 1 })}
        onSortChange={(sortBy, sortOrder) => updateParams({ sortBy, sortOrder, page: 1 })}

        isLoading={isLoading}
        toolbar={toolbar}
        toolbarActions={toolbarActions}
        emptyState={
          <EmptyState
            icon={Target}
            title="No leads found"
            description={
              params.search
                ? `No results for "${params.search}".`
                : hasActiveFilter
                  ? 'No leads match the selected filters.'
                  : canViewAllLeads()
                    ? 'No leads have been created yet.'
                    : 'No leads are currently assigned to you.'
            }
          >
            {canCreate && !params.search && !hasActiveFilter && onCreateLead && (
              <Button size="sm" className="crm-btn-primary gap-1.5 rounded-lg" onClick={onCreateLead}>
                <Plus className="h-3.5 w-3.5" />
                Create First Lead
              </Button>
            )}
          </EmptyState>
        }
      />
      <LeadProcessDialog
        lead={selectedLead}
        open={processOpen}
        onOpenChange={setProcessOpen}
        onRefresh={refetch}
      />
    </div>
  );
}
