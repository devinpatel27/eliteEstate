'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Star,
  Calendar,
  CalendarClock,
  AlertCircle,
  Flame,
  Sun,
  ThermometerSnowflake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLeadStatsForFilters } from '@/features/dashboard/hooks/useDashboardOverview';
import { cn } from '@/lib/utils';

const SMART_FILTERS = [
  {
    id: 'new',
    label: 'New',
    sublabel: 'Fresh inquiries',
    icon: Star,
    href: '/leads?status=new',
    tone:
      'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-emerald-800 dark:border-emerald-800/60 dark:from-emerald-950/50 dark:to-emerald-900/30 dark:text-emerald-300',
    iconTone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    countKey: 'newLeads' as const,
  },
  {
    id: 'today',
    label: 'Today',
    sublabel: 'Follow-ups today',
    icon: Calendar,
    href: '/leads?followUpDue=today',
    tone:
      'border-blue-200/80 bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-800 dark:border-blue-800/60 dark:from-blue-950/50 dark:to-blue-900/30 dark:text-blue-300',
    iconTone: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    countKey: 'todayFollowUps' as const,
    visitKey: 'todayVisits' as const,
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    sublabel: 'Follow-ups tomorrow',
    icon: CalendarClock,
    href: '/leads?followUpDue=tomorrow',
    tone:
      'border-violet-200/80 bg-gradient-to-br from-violet-50 to-violet-100/80 text-violet-800 dark:border-violet-800/60 dark:from-violet-950/50 dark:to-violet-900/30 dark:text-violet-300',
    iconTone: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    countKey: 'tomorrowFollowUps' as const,
    visitKey: 'tomorrowVisits' as const,
  },
  {
    id: 'due',
    label: 'Due',
    sublabel: 'Overdue follow-ups + visits',
    icon: AlertCircle,
    href: '/leads?followUpDue=overdue',
    tone:
      'border-orange-200/80 bg-gradient-to-br from-orange-50 to-orange-100/80 text-orange-800 dark:border-orange-800/60 dark:from-orange-950/50 dark:to-orange-900/30 dark:text-orange-300',
    iconTone: 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
    countKey: 'overdueFollowUps' as const,
    visitKey: 'overdueVisits' as const,
  },
];

const THERMAL_FILTERS = [
  {
    id: 'hot',
    label: 'Hot',
    icon: Flame,
    href: '/leads?priority=hot',
    tone:
      'border-red-200/80 bg-red-50/90 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
    countKey: 'hotLeads' as const,
  },
  {
    id: 'warm',
    label: 'Warm',
    icon: Sun,
    href: '/leads?priority=warm',
    tone:
      'border-amber-200/80 bg-amber-50/90 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    countKey: 'warmLeads' as const,
  },
  {
    id: 'cold',
    label: 'Cold',
    icon: ThermometerSnowflake,
    href: '/leads?priority=cold',
    tone:
      'border-sky-200/80 bg-sky-50/90 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
    countKey: 'coldLeads' as const,
  },
];

export function SmartFilters() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: stats } = useLeadStatsForFilters();

  const badgeCount =
    (stats?.newLeads || 0) +
    (stats?.overdueFollowUps || 0);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative transition hover:bg-primary/10"
          title="Smart Filters"
        >
          <LayoutGrid className="h-4 w-4" />
          {badgeCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] border-border/60 bg-popover p-0 shadow-xl">
        <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Smart Filters</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Jump to matching leads in one click</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-3">
          {SMART_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const leadCount = stats?.[filter.countKey] ?? 0;
            const visitCount = filter.visitKey ? (stats?.[filter.visitKey] ?? 0) : 0;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => navigate(filter.href)}
                className={cn(
                  'group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition duration-200',
                  'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] dark:hover:shadow-black/30',
                  filter.tone
                )}
              >
                {leadCount > 0 && (
                  <span className="absolute right-2.5 top-2.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-background/90 px-1.5 text-[11px] font-bold text-foreground shadow-sm dark:bg-foreground/15 dark:text-foreground">
                    {leadCount}
                  </span>
                )}
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm', filter.iconTone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-bold">{filter.label}</span>
                  <p className="mt-0.5 text-[10px] opacity-80">{filter.sublabel}</p>
                  {visitCount > 0 && filter.id !== 'new' && (
                    <p className="mt-1 text-[10px] font-medium opacity-70">+{visitCount} visits</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Thermal Quality</p>
          <div className="grid grid-cols-3 gap-2">
            {THERMAL_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const count = stats?.[filter.countKey] ?? 0;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => navigate(filter.href)}
                  className={cn(
                    'group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition duration-200',
                    'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]',
                    filter.tone
                  )}
                >
                  {count > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-background/90 px-1 text-[10px] font-bold text-foreground shadow-sm dark:bg-foreground/15">
                      {count}
                    </span>
                  )}
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-bold">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
