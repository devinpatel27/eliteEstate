'use client';

import Link from 'next/link';
import {
  Star,
  Calendar,
  CalendarClock,
  AlertCircle,
  Flame,
  Sun,
  ThermometerSnowflake,
  Clock,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardOverview, DashboardViewMode } from '../types/dashboard.types';
import { cn } from '@/lib/utils';

interface DashboardKpiStripProps {
  overview?: DashboardOverview | null;
  isLoading?: boolean;
}

function getFreshLabel(viewMode: DashboardViewMode) {
  if (viewMode === 'employee') return 'My Fresh Leads';
  if (viewMode === 'preview') return 'Fresh Leads';
  return 'Company Fresh Leads';
}

function getScheduleLabel(viewMode: DashboardViewMode) {
  if (viewMode === 'employee') return 'My Schedule';
  if (viewMode === 'preview') return 'Schedule';
  return 'Company Schedule';
}

interface ScheduleCardProps {
  label: string;
  value: number;
  followUps: number;
  visits: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconBg: string;
  ring?: string;
}

function ScheduleCard({ label, value, followUps, visits, href, icon: Icon, accent, iconBg, ring }: ScheduleCardProps) {
  const hasItems = value > 0;

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex min-w-0 flex-1 flex-col gap-2 overflow-hidden rounded-xl border bg-background p-3 transition duration-200',
        'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]',
        hasItems ? ring : 'border-border/70 hover:border-primary/25'
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', accent)} />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="pl-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {followUps} follow-up{followUps !== 1 ? 's' : ''} · {visits} visit{visits !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  );
}

interface ThermalCardProps {
  label: string;
  value: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  cardClass: string;
  iconClass: string;
  badgeClass: string;
}

function ThermalCard({ label, value, href, icon: Icon, cardClass, iconClass, badgeClass }: ThermalCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition duration-200',
        'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]',
        cardClass
      )}
    >
      <div className={cn('relative flex h-10 w-10 items-center justify-center rounded-full', iconClass)}>
        <Icon className="h-5 w-5" />
        {value > 0 && (
          <span className={cn('absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm', badgeClass)}>
            {value > 99 ? '99+' : value}
          </span>
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
    </Link>
  );
}

export function DashboardKpiStrip({ overview, isLoading }: DashboardKpiStripProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const viewMode =
    overview.viewMode ||
    (overview.isPreview ? 'preview' : overview.isAdminView ? 'admin' : 'employee');

  const { timeline, thermal, freshLeads } = overview;

  return (
    <div className="space-y-3">
      {/* Fresh leads — standout strip */}
      <Link
        href="/leads?status=new"
        className="group flex items-center justify-between gap-4 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-500/10 via-emerald-50/80 to-transparent px-4 py-3 transition duration-200 hover:border-emerald-300 hover:shadow-md dark:border-emerald-800/60 dark:from-emerald-950/50 dark:via-emerald-950/30 dark:to-transparent dark:hover:border-emerald-700"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {getFreshLabel(viewMode)}
            </p>
            <p className="text-3xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">{freshLeads}</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition group-hover:bg-emerald-500/20 dark:text-emerald-400">
          View new <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Schedule group — Today / Tomorrow / Due */}
        <Card className="crm-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 bg-blue-50/50 px-4 py-2.5 dark:bg-blue-950/25">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">Timeline</p>
                <p className="text-[10px] text-muted-foreground">{getScheduleLabel(viewMode)}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Follow-ups + visits
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            <ScheduleCard
              label="Today"
              value={timeline.unique?.today ?? timeline.followUps.today + timeline.visits.today}
              followUps={timeline.followUps.today}
              visits={timeline.visits.today}
              href="/leads?followUpDue=today"
              icon={Calendar}
              accent="bg-blue-500"
              iconBg="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
              ring={(timeline.unique?.today ?? 0) > 0 ? 'border-blue-300/80 shadow-sm shadow-blue-500/10 dark:border-blue-700/80 dark:shadow-blue-500/20' : undefined}
            />
            <ScheduleCard
              label="Tomorrow"
              value={timeline.unique?.tomorrow ?? timeline.followUps.tomorrow + timeline.visits.tomorrow}
              followUps={timeline.followUps.tomorrow}
              visits={timeline.visits.tomorrow}
              href="/leads?followUpDue=tomorrow"
              icon={CalendarClock}
              accent="bg-violet-500"
              iconBg="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
              ring={(timeline.unique?.tomorrow ?? 0) > 0 ? 'border-violet-300/80 shadow-sm shadow-violet-500/10 dark:border-violet-700/80 dark:shadow-violet-500/20' : undefined}
            />
            <ScheduleCard
              label="Due"
              value={timeline.unique?.due ?? timeline.followUps.due + timeline.visits.due}
              followUps={timeline.followUps.due}
              visits={timeline.visits.due}
              href="/leads?followUpDue=overdue"
              icon={AlertCircle}
              accent="bg-orange-500"
              iconBg="bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
              ring={(timeline.unique?.due ?? 0) > 0 ? 'border-orange-400/80 shadow-sm shadow-orange-500/15 dark:border-orange-700/80 dark:shadow-orange-500/20' : undefined}
            />
          </div>
        </Card>

        {/* Thermal group — Hot / Warm / Cold */}
        <Card className="crm-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 bg-amber-50/50 px-4 py-2.5 dark:bg-amber-950/25">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">Lead Quality</p>
                <p className="text-[10px] text-muted-foreground">Hot · Warm · Cold</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-[10px] text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300">Thermal</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            <ThermalCard
              label="Hot"
              value={thermal.hot}
              href="/leads?priority=hot"
              icon={Flame}
              cardClass="border-red-200/80 bg-gradient-to-b from-red-50/90 to-background hover:border-red-300 dark:border-red-900/60 dark:from-red-950/40 dark:to-card dark:hover:border-red-700"
              iconClass="bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
              badgeClass="bg-red-500"
            />
            <ThermalCard
              label="Warm"
              value={thermal.warm}
              href="/leads?priority=warm"
              icon={Sun}
              cardClass="border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-background hover:border-amber-300 dark:border-amber-900/60 dark:from-amber-950/40 dark:to-card dark:hover:border-amber-700"
              iconClass="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
              badgeClass="bg-amber-500"
            />
            <ThermalCard
              label="Cold"
              value={thermal.cold}
              href="/leads?priority=cold"
              icon={ThermometerSnowflake}
              cardClass="border-sky-200/80 bg-gradient-to-b from-sky-50/90 to-background hover:border-sky-300 dark:border-sky-900/60 dark:from-sky-950/40 dark:to-card dark:hover:border-sky-700"
              iconClass="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
              badgeClass="bg-sky-500"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
