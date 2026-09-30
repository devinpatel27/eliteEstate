import { Badge } from '@/components/ui/badge';
import { cn, formatLeadPriority, formatLeadStatus, normalizeLeadPriority, normalizeLeadStatus } from '@/lib/utils';

const statusColors: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  booked: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  closed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const priorityColors: Record<string, string> = {
  hot: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  warm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  cold: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const fallbackBadge = 'bg-muted text-muted-foreground dark:bg-muted/60';

export function LeadStatusBadge({ status }: { status?: string }) {
  const normalized = normalizeLeadStatus(status);
  return (
    <Badge variant="outline" className={cn('text-xs font-medium border-0', statusColors[normalized] || fallbackBadge)}>
      {formatLeadStatus(status)}
    </Badge>
  );
}

export function LeadPriorityBadge({ priority }: { priority?: string }) {
  const normalized = normalizeLeadPriority(priority);
  return (
    <Badge variant="outline" className={cn('text-xs font-medium border-0', priorityColors[normalized] || fallbackBadge)}>
      {formatLeadPriority(priority)}
    </Badge>
  );
}
