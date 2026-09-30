'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Target, Calendar, AlertTriangle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FilterTabs } from '@/components/common/FilterTabs';
import { DashboardOverview, DashboardViewMode, LeadTaskItem, VisitTaskItem } from '../types/dashboard.types';
import { formatDate, formatLeadPriority } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TaskCardsSectionProps {
  overview?: DashboardOverview | null;
  title?: string;
  showSearch?: boolean;
  embedded?: boolean;
  tabbed?: boolean;
}

type Bucket = 'today' | 'tomorrow' | 'due';

const BUCKETS: { key: Bucket; label: string; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
  { key: 'today', label: 'Today', icon: Calendar, tone: 'border-blue-200/80 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20' },
  { key: 'tomorrow', label: 'Tomorrow', icon: Calendar, tone: 'border-violet-200/80 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20' },
  { key: 'due', label: 'Due / Overdue', icon: AlertTriangle, tone: 'border-orange-200/80 bg-orange-50/40 dark:border-orange-900 dark:bg-orange-950/20' },
];

const TAB_OPTIONS = [
  { value: 'today' as const, label: 'Today' },
  { value: 'tomorrow' as const, label: 'Tomorrow' },
  { value: 'due' as const, label: 'Due' },
];

function getWorkboardTitle(viewMode: DashboardViewMode, name: string) {
  if (viewMode === 'preview') return `${name}'s Workboard`;
  if (viewMode === 'employee') return 'My Workboard';
  return "Today's Workboard";
}

function matchesSearch(query: string, ...parts: (string | undefined)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => p?.toLowerCase().includes(q));
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    hot: 'bg-red-100 text-red-700',
    warm: 'bg-amber-100 text-amber-700',
    cold: 'bg-sky-100 text-sky-700',
  };
  return map[priority] || 'bg-muted text-muted-foreground';
}

function LeadTaskCard({ item, showAssignee, flat }: { item: LeadTaskItem; showAssignee?: boolean; flat?: boolean }) {
  return (
    <Link
      href={`/leads/${item._id}`}
      className={cn(
        'block rounded-lg p-3 transition duration-200 hover:bg-muted/60',
        flat ? 'bg-muted/30' : 'rounded-xl border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.customerName}</p>
          <p className="text-xs text-muted-foreground">{item.leadId} · {item.mobile}</p>
          {showAssignee && item.assignedToName && (
            <p className="mt-0.5 text-[11px] text-primary">{item.assignedToName}</p>
          )}
        </div>
        <Badge className={cn('shrink-0 text-[10px] uppercase', priorityBadge(item.priority))}>
          {formatLeadPriority(item.priority)}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        NFD: {item.nextFollowUpDate ? formatDate(item.nextFollowUpDate) : '—'} · {item.source}
      </p>
    </Link>
  );
}

function VisitTaskCard({ item, flat }: { item: VisitTaskItem; flat?: boolean }) {
  return (
    <Link
      href={item.lead?._id ? `/leads/${item.lead._id}` : '/visits'}
      className={cn(
        'block rounded-lg p-3 transition duration-200 hover:bg-muted/60',
        flat ? 'bg-muted/30' : 'rounded-xl border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.lead?.customerName || 'Visit'}</p>
          <p className="text-xs text-muted-foreground capitalize">{item.type.replace(/_/g, ' ')}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{item.status}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDate(item.scheduledDate)}{item.scheduledTime ? ` · ${item.scheduledTime}` : ''}
      </p>
    </Link>
  );
}

function BucketContent({
  label,
  visits,
  leads,
  showAssignee,
  flat,
}: {
  label: string;
  visits: VisitTaskItem[];
  leads: LeadTaskItem[];
  showAssignee?: boolean;
  flat?: boolean;
}) {
  const total = visits.length + leads.length;

  return (
    <div className="space-y-3">
      {visits.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Visits ({visits.length})
          </p>
          {visits.map((v) => <VisitTaskCard key={v._id} item={v} flat={flat} />)}
        </div>
      )}
      {leads.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Follow-ups ({leads.length})
          </p>
          {leads.map((l) => <LeadTaskCard key={l._id} item={l} showAssignee={showAssignee} flat={flat} />)}
        </div>
      )}
      {total === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No tasks for {label.toLowerCase()}</p>
      )}
    </div>
  );
}

function BucketColumn({
  label,
  icon: Icon,
  tone,
  visits,
  leads,
  showAssignee,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  visits: VisitTaskItem[];
  leads: LeadTaskItem[];
  showAssignee?: boolean;
}) {
  const total = visits.length + leads.length;

  return (
    <div className={cn('overflow-hidden rounded-xl border p-0 transition-shadow duration-200', tone)}>
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <h4 className="text-sm font-bold">{label}</h4>
        </div>
        <Badge variant="secondary">{total}</Badge>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
        <BucketContent label={label} visits={visits} leads={leads} showAssignee={showAssignee} />
      </div>
    </div>
  );
}

export function TaskCardsSection({ overview, title, showSearch, embedded, tabbed }: TaskCardsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBucket, setActiveBucket] = useState<Bucket>('today');

  const filteredOverview = useMemo(() => {
    if (!overview) return null;
    const q = searchQuery.trim();
    if (!q) return overview;

    const filterLeads = (items: LeadTaskItem[]) =>
      items.filter((item) =>
        matchesSearch(q, item.customerName, item.mobile, item.leadId, item.source, item.assignedToName)
      );

    const filterVisits = (items: VisitTaskItem[]) =>
      items.filter((item) =>
        matchesSearch(
          q,
          item.lead?.customerName,
          item.lead?.mobile,
          item.lead?.leadId,
          item.type,
          item.remark
        )
      );

    return {
      ...overview,
      visitTasks: {
        today: filterVisits(overview.visitTasks.today),
        tomorrow: filterVisits(overview.visitTasks.tomorrow),
        due: filterVisits(overview.visitTasks.due),
      },
      leadTasks: {
        today: filterLeads(overview.leadTasks.today),
        tomorrow: filterLeads(overview.leadTasks.tomorrow),
        due: filterLeads(overview.leadTasks.due),
      },
    };
  }, [overview, searchQuery]);

  if (!overview || !filteredOverview) return null;

  const viewMode = overview.viewMode || (overview.isPreview ? 'preview' : overview.isAdminView ? 'admin' : 'employee');
  const sectionTitle = title || getWorkboardTitle(viewMode, overview.employee.name);
  const showAssignee = overview.isAdminView;

  const bucketCounts = {
    today: filteredOverview.visitTasks.today.length + filteredOverview.leadTasks.today.length,
    tomorrow: filteredOverview.visitTasks.tomorrow.length + filteredOverview.leadTasks.tomorrow.length,
    due: filteredOverview.visitTasks.due.length + filteredOverview.leadTasks.due.length,
  };

  const tabOptions = TAB_OPTIONS.map((opt) => ({
    ...opt,
    label: `${opt.label} (${bucketCounts[opt.value]})`,
  }));

  return (
    <div className={embedded ? '' : 'space-y-4'}>
      {!embedded && (
        <h2 className="text-lg font-semibold">{sectionTitle}</h2>
      )}

      {(tabbed || showSearch) && (
        <div className={cn('crm-workboard-toolbar', !embedded && 'mb-4')}>
          {tabbed && (
            <FilterTabs
              aria-label="Workboard schedule"
              value={activeBucket}
              onChange={setActiveBucket}
              options={tabOptions}
            />
          )}
          {showSearch && (
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, mobile, lead ID..."
                className="crm-toolbar-input w-full pl-9 text-sm"
              />
            </div>
          )}
        </div>
      )}

      {tabbed ? (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <BucketContent
            label={BUCKETS.find((b) => b.key === activeBucket)?.label || 'Today'}
            visits={filteredOverview.visitTasks[activeBucket]}
            leads={filteredOverview.leadTasks[activeBucket]}
            showAssignee={showAssignee}
            flat
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {BUCKETS.map(({ key, label, icon, tone }) => (
            <BucketColumn
              key={key}
              label={label}
              icon={icon}
              tone={tone}
              visits={filteredOverview.visitTasks[key]}
              leads={filteredOverview.leadTasks[key]}
              showAssignee={showAssignee}
            />
          ))}
        </div>
      )}
    </div>
  );
}
