'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Eye,
  BarChart3,
  Filter,
  MapPin,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEmployeePerformance,
  useEmployeeLeadStream,
  useLeadFollowUpJourney,
  useDashboardOverview,
} from '../hooks/useDashboardOverview';
import { EmployeePerformanceRow } from '../types/dashboard.types';
import { cn, formatDate, formatLeadPriority, formatLeadStatus, getImageUrl, getInitials } from '@/lib/utils';

const METRIC_COLUMNS = [
  { key: 'newEnquiry' as const, label: 'New Enquiry', tone: 'text-blue-600 bg-blue-50' },
  { key: 'phoneCall' as const, label: 'Phone Call', tone: 'text-amber-600 bg-amber-50' },
  { key: 'siteVisit' as const, label: 'Site Visit', tone: 'text-violet-600 bg-violet-50' },
  { key: 'multipleVisit' as const, label: 'Multiple Visit', tone: 'text-indigo-600 bg-indigo-50' },
  { key: 'discussion' as const, label: 'Discussion', tone: 'text-slate-600 bg-slate-100' },
  { key: 'dealSucceed' as const, label: 'Deal Succeed', tone: 'text-emerald-600 bg-emerald-50' },
  { key: 'dealLost' as const, label: 'Deal Lost', tone: 'text-red-600 bg-red-50' },
];

const SCHEDULE_COLUMNS = [
  { key: 'visitsTomorrow' as const, label: 'Visits Tomorrow', icon: CalendarClock, highlight: true },
  { key: 'followUpsTomorrow' as const, label: 'Follow-ups Tomorrow', icon: CalendarClock, highlight: false },
  { key: 'due' as const, label: 'Due', icon: AlertTriangle, highlight: false, computed: true },
];

interface EmployeePerformanceBoardProps {
  onPreviewEmployee?: (employeeId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
}

function MetricCell({ value, tone }: { value: number; tone: string }) {
  return (
    <div className={cn('mx-auto flex h-9 w-12 items-center justify-center rounded-lg text-sm font-bold tabular-nums', tone)}>
      {value}
    </div>
  );
}

function ScheduleCell({
  value,
  highlight,
}: {
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg px-2 text-sm font-bold tabular-nums',
        highlight && value > 0
          ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
          : value > 0
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground'
      )}
    >
      {value}
    </div>
  );
}

function getDueCount(schedule: EmployeePerformanceRow['schedule']) {
  return schedule.visitsDue + schedule.followUpsDue;
}

function getScheduleValue(
  schedule: EmployeePerformanceRow['schedule'],
  col: (typeof SCHEDULE_COLUMNS)[number]
) {
  if (col.computed) return getDueCount(schedule);
  if (col.key === 'visitsTomorrow') return schedule.visitsTomorrow;
  return schedule.followUpsTomorrow;
}

function VisitsTomorrowPanel({ employeeId }: { employeeId: string }) {
  const { data: overview, isLoading } = useDashboardOverview(employeeId);

  if (isLoading) {
    return <Skeleton className="mb-4 h-16 w-full" />;
  }

  const visits = overview?.visitTasks.tomorrow || [];
  if (visits.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
        <MapPin className="h-3.5 w-3.5" />
        Visits Tomorrow ({visits.length})
      </p>
      <ul className="space-y-2">
        {visits.map((v) => (
          <li key={v._id}>
            <Link
              href={v.lead?._id ? `/leads/${v.lead._id}` : '/visits'}
              className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm transition hover:border-primary/30 hover:shadow-sm"
            >
              <span className="font-medium">{v.lead?.customerName || 'Visit'}</span>
              <span className="text-xs text-muted-foreground capitalize">{v.type.replace(/_/g, ' ')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeadStreamPanel({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const { data: leads, isLoading } = useEmployeeLeadStream(employeeId);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-4"><Skeleton className="h-24 w-full" /></div>;
  }

  return (
    <div className="border-t bg-muted/20 p-4">
      <VisitsTomorrowPanel employeeId={employeeId} />

      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Inquiry Stream for {employeeName}
        </p>
        <Badge variant="secondary">{leads?.length || 0} records</Badge>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Lead Status</th>
              <th className="px-4 py-3">NFD</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {(leads || []).map((lead) => (
              <Fragment key={lead._id}>
                <tr className="border-b last:border-0 transition hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.customerName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.mobile}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] uppercase">{lead.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="text-[10px] uppercase">{formatLeadPriority(lead.priority)}</Badge>
                  </td>
                  <td className="px-4 py-3">{lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="secondary" className="text-[10px]">{formatLeadStatus(lead.status)}</Badge>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full transition hover:bg-primary/10"
                        onClick={() => setExpandedLeadId(expandedLeadId === lead._id ? null : lead._id)}
                      >
                        {expandedLeadId === lead._id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedLeadId === lead._id && (
                  <tr>
                    <td colSpan={6} className="bg-muted/10 px-4 py-4">
                      <FollowUpJourney leadId={lead._id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!leads?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No active inquiries</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FollowUpJourney({ leadId }: { leadId: string }) {
  const { data: items, isLoading } = useLeadFollowUpJourney(leadId);

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-semibold">Full Inquiry Progress Journey</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Complete follow-up timeline</p>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !items?.length ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No follow-up records found
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="rounded-lg border px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium capitalize">{item.type.replace(/_/g, ' ')}</span>
                <span className="text-xs text-muted-foreground">{formatDate(item.followUpDate)}</span>
              </div>
              {item.remark && <p className="mt-1 text-muted-foreground">{item.remark}</p>}
              {item.createdBy && <p className="mt-1 text-xs text-muted-foreground">By {item.createdBy}</p>}
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 text-right">
        <Button variant="link" size="sm" asChild>
          <Link href={`/leads/${leadId}`}>Open lead profile</Link>
        </Button>
      </div>
    </div>
  );
}

function EmployeeRow({
  row,
  onPreviewEmployee,
  onSelectEmployee,
}: {
  row: EmployeePerformanceRow;
  onPreviewEmployee?: (employeeId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <tr className="border-b transition hover:bg-muted/40">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={getImageUrl(row.profileImage)} />
              <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{row.name}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.role}</p>
            </div>
          </div>
        </td>
        {SCHEDULE_COLUMNS.map((col) => {
          const value = getScheduleValue(row.schedule, col);
          return (
            <td key={col.key} className="px-2 py-3 text-center">
              <ScheduleCell value={value} highlight={col.highlight} />
            </td>
          );
        })}
        {METRIC_COLUMNS.map((col) => (
          <td key={col.key} className="px-2 py-3 text-center">
            <MetricCell value={row.metrics[col.key]} tone={col.tone} />
          </td>
        ))}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            {onPreviewEmployee && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 transition hover:bg-primary/10"
                title="Preview dashboard"
                onClick={() => onPreviewEmployee(row._id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onSelectEmployee && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="hidden text-xs transition hover:bg-primary/10 lg:inline-flex"
                onClick={() => onSelectEmployee(row._id)}
              >
                Workboard
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              className={cn('h-8 w-8 rounded-full transition', open ? 'crm-btn-primary' : 'hover:bg-primary/10')}
              variant={open ? 'default' : 'outline'}
              onClick={() => setOpen(!open)}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={SCHEDULE_COLUMNS.length + METRIC_COLUMNS.length + 2} className="p-0">
            <LeadStreamPanel employeeId={row._id} employeeName={row.name} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function EmployeePerformanceBoard({ onPreviewEmployee, onSelectEmployee }: EmployeePerformanceBoardProps) {
  const { data, isLoading } = useEmployeePerformance();

  if (isLoading) {
    return <Card className="crm-card p-6 transition-shadow duration-200"><Skeleton className="h-40 w-full" /></Card>;
  }

  if (!data) return null;

  return (
    <Card className="crm-card overflow-hidden transition-shadow duration-200">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Employee Performance Board</h2>
        </div>
        <Badge variant="secondary">{data.employees.length} results</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Employee</th>
              {SCHEDULE_COLUMNS.map((col) => (
                <th key={col.key} className="px-2 py-3 text-center">{col.label}</th>
              ))}
              {METRIC_COLUMNS.map((col) => (
                <th key={col.key} className="px-2 py-3 text-center">{col.label}</th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-amber-50/40 dark:bg-amber-950/10">
              <td className="px-4 py-3 font-semibold">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
                Summary / Total
              </td>
              {SCHEDULE_COLUMNS.map((col) => {
                const value = getScheduleValue(data.scheduleSummary, col);
                return (
                  <td key={col.key} className="px-2 py-3 text-center">
                    <ScheduleCell value={value} highlight={col.highlight} />
                  </td>
                );
              })}
              {METRIC_COLUMNS.map((col) => (
                <td key={col.key} className="px-2 py-3 text-center">
                  <MetricCell value={data.summary[col.key]} tone={col.tone} />
                </td>
              ))}
              <td />
            </tr>
            {data.employees.map((row) => (
              <EmployeeRow
                key={row._id}
                row={row}
                onPreviewEmployee={onPreviewEmployee}
                onSelectEmployee={onSelectEmployee}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
