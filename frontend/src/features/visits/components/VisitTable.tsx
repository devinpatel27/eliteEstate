'use client';

import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { ChevronDown, ChevronRight, Eye, Plus, Search, MapPin, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { FilterTabs } from '@/components/common/FilterTabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useVisitList } from '../hooks/useVisits';
import { VisitDetailDrawer } from './VisitDetailDrawer';
import { CreateVisitDialog } from './CreateVisitDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS, VISIT_TYPES, VISIT_STATUSES } from '@/lib/constants';
import { Visit } from '../types/visit.types';
import { formatDate, cn } from '@/lib/utils';

type VisitGroup = {
  leadKey: string;
  lead: Visit['lead'];
  visits: Visit[];
  latestVisit: Visit;
};

function getTypeLabel(type: string) {
  return VISIT_TYPES.find((item) => item.value === type)?.label || type.replace(/_/g, ' ');
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default';
  if (status === 'cancelled') return 'destructive';
  if (status === 'rescheduled') return 'secondary';
  return 'outline';
}

function groupVisitsByLead(visits: Visit[]): VisitGroup[] {
  const map = new Map<string, VisitGroup>();
  for (const visit of visits) {
    const leadKey = visit.lead?._id || visit.leadId || visit._id;
    const existing = map.get(leadKey);
    if (!existing) {
      map.set(leadKey, {
        leadKey,
        lead: visit.lead,
        visits: [visit],
        latestVisit: visit,
      });
      continue;
    }
    existing.visits.push(visit);
    if (new Date(visit.scheduledDate).getTime() > new Date(existing.latestVisit.scheduledDate).getTime()) {
      existing.latestVisit = visit;
    }
  }
  return [...map.values()].map((group) => ({
    ...group,
    visits: group.visits.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()),
  }));
}

export function VisitTable() {
  const { hasPermission, isReady } = usePermissions();
  const canViewAllVisits = isReady && hasPermission(PERMISSIONS.VISIT_READ);
  const { visits, totalCount, pageCount, isLoading, params, updateParams, refetch, patchVisit, toggleFavoriteOptimistic } = useVisitList();
  const [searchInput, setSearchInput] = useState(params.search || '');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const debouncedSearch = useDebounce(searchInput, 300);

  const canCreate = isReady && hasPermission(PERMISSIONS.VISIT_CREATE);
  const canUpdate = isReady && hasPermission(PERMISSIONS.VISIT_UPDATE);
  const canFavorite = isReady && hasPermission(PERMISSIONS.VISIT_FAVORITE);

  useEffect(() => {
    const nextSearch = debouncedSearch || undefined;
    if (nextSearch === (params.search || undefined)) return;
    updateParams({ search: nextSearch, page: 1 });
  }, [debouncedSearch, params.search, updateParams]);

  const handleToggleFavorite = async (visit: Visit) => {
    await toggleFavoriteOptimistic(visit);
    if (selectedVisit?._id === visit._id) {
      setSelectedVisit({ ...visit, isFavorite: !visit.isFavorite });
    }
  };

  const groups = groupVisitsByLead(visits);

  const openVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setDetailOpen(true);
  };

  const toolbar = (
    <div className="w-full min-w-0 space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(180px,1fr)_auto_auto_auto] md:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, mobile, lead ID, employee, remark..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="crm-toolbar-input w-full pl-9 text-sm"
          />
        </div>
        <Select
          value={params.type || 'all'}
          onValueChange={(v) => updateParams({ type: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="crm-select-trigger w-full text-sm md:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {VISIT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.status || 'all'}
          onValueChange={(v) => updateParams({ status: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="crm-select-trigger w-full text-sm md:w-[132px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {VISIT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canFavorite && (
          <FilterTabs
            aria-label="Favorite filter"
            value={params.favorite === true ? 'true' : params.favorite === false ? 'false' : 'all'}
            onChange={(v) =>
              updateParams({
                favorite: v === 'true' ? true : v === 'false' ? false : undefined,
                page: 1,
              })
            }
            options={[
              { value: 'all', label: 'All' },
              { value: 'true', label: 'Favorites', icon: <Star className="h-3 w-3" /> },
              { value: 'false', label: 'Non-favorites' },
            ]}
          />
        )}
      </div>
      <DateRangePicker
        dateFrom={params.dateFrom}
        dateTo={params.dateTo}
        onChange={(range) => updateParams({ ...range, page: 1 })}
        className="w-full sm:w-auto"
      />
    </div>
  );

  const toolbarActions = canCreate ? (
    <Button
      size="sm"
      className="crm-btn-primary h-9 gap-1.5 rounded-lg px-3"
      onClick={() => setCreateOpen(true)}
    >
      <Plus className="h-3.5 w-3.5" />
      Schedule Visit
    </Button>
  ) : null;

  return (
    <>
      <div className="space-y-3">
        <div className="crm-table-toolbar flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <div className="flex shrink-0 items-center gap-2">{toolbarActions}</div>
        </div>
        <div className="crm-table-wrap overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="h-11 px-3">Lead / Customer</th>
                <th className="h-11 px-3">Visits</th>
                <th className="h-11 px-3">Latest Schedule</th>
                <th className="h-11 px-3">Status</th>
                <th className="h-11 px-3">Assigned</th>
                <th className="h-11 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && groups.length === 0 ? (
                Array.from({ length: params.limit ?? 10 }).map((_, index) => (
                  <tr key={index} className="border-t border-border/60">
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="h-12 px-3">
                        <div className="h-4 rounded bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-48 p-0">
                    <EmptyState
                      icon={MapPin}
                      title="No visits found"
                      description={
                        canViewAllVisits
                          ? 'Schedule a visit or add a visit-type follow-up on a lead.'
                          : 'No visits for your assigned leads yet.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const expanded = Boolean(openGroups[group.leadKey]);
                  const favorite = group.visits.some((visit) => visit.isFavorite);
                  return (
                    <Fragment key={group.leadKey}>
                      <tr
                        key={group.leadKey}
                        className={cn(
                          'border-t border-border/60 transition-colors hover:bg-muted/30',
                          favorite && 'bg-amber-500/10'
                        )}
                      >
                        <td className="h-14 px-3">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left"
                            onClick={() => setOpenGroups((prev) => ({ ...prev, [group.leadKey]: !expanded }))}
                          >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <div>
                              <p className="font-medium">{group.lead?.customerName || 'Unknown lead'}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.lead?.leadId || '-'} · {group.lead?.mobile || '-'}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[11px]">{group.visits.length} total</Badge>
                            {group.visits.some((visit) => visit.type === 'revisit') && (
                              <Badge variant="secondary" className="text-[11px]">Revisit</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 text-xs">
                          <p className="font-medium">{formatDate(group.latestVisit.scheduledDate)}</p>
                          {group.latestVisit.scheduledTime && <p className="text-muted-foreground">{group.latestVisit.scheduledTime}</p>}
                        </td>
                        <td className="px-3">
                          <Badge variant={getStatusVariant(group.latestVisit.status)} className="text-[11px] capitalize">
                            {group.latestVisit.status}
                          </Badge>
                        </td>
                        <td className="px-3 text-xs">{group.lead?.assignedTo?.name || 'Unassigned'}</td>
                        <td className="px-3 text-right">
                          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => openVisit(group.latestVisit)}>
                            <Eye className="h-3.5 w-3.5" />
                            Latest
                          </Button>
                        </td>
                      </tr>
                      {expanded && group.visits.map((visit) => (
                        <tr key={visit._id} className="border-t border-border/40 bg-muted/15">
                          <td className="px-10 py-2 text-xs text-muted-foreground">{visit.remark || 'No remark'}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{getTypeLabel(visit.type)}</Badge></td>
                          <td className="px-3 py-2 text-xs">{formatDate(visit.scheduledDate)} {visit.scheduledTime || ''}</td>
                          <td className="px-3 py-2"><Badge variant={getStatusVariant(visit.status)} className="text-[10px] capitalize">{visit.status}</Badge></td>
                          <td className="px-3 py-2 text-xs">{visit.source === 'follow_up' ? 'Follow-up' : 'Manual'}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              {canFavorite && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleFavorite(visit)}>
                                  <Star className={cn('h-3.5 w-3.5', visit.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50')} />
                                </Button>
                              )}
                              <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => openVisit(visit)}>View</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
          <div className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{totalCount === 0 ? 0 : ((params.page ?? 1) - 1) * (params.limit ?? 10) + 1}</span> to{' '}
            <span className="font-medium text-foreground">{Math.min((params.page ?? 1) * (params.limit ?? 10), totalCount)}</span> of{' '}
            <span className="font-medium text-foreground">{totalCount}</span> visits
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={(params.page ?? 1) <= 1} onClick={() => updateParams({ page: (params.page ?? 1) - 1 })}>Previous</Button>
            <span className="text-xs font-medium">{params.page ?? 1} / {Math.max(1, pageCount)}</span>
            <Button variant="outline" size="sm" disabled={(params.page ?? 1) >= pageCount} onClick={() => updateParams({ page: (params.page ?? 1) + 1 })}>Next</Button>
          </div>
        </div>
      </div>

      <VisitDetailDrawer
        visit={selectedVisit}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRefresh={refetch}
        onFavoriteToggle={(visitId, isFavorite) => {
          patchVisit(visitId, { isFavorite });
          if (selectedVisit?._id === visitId) {
            setSelectedVisit((prev) => (prev ? { ...prev, isFavorite } : prev));
          }
        }}
        canUpdate={canUpdate}
        canFavorite={canFavorite}
      />

      <CreateVisitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />
    </>
  );
}
