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
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from './StatsCard';
import { DashboardOverview, DashboardViewMode } from '../types/dashboard.types';

interface DashboardHeroCardsProps {
  overview?: DashboardOverview | null;
  isLoading?: boolean;
}

function getFreshLeadsLabel(viewMode: DashboardViewMode, name: string) {
  if (viewMode === 'preview') return `${name}'s Fresh Leads`;
  if (viewMode === 'employee') return 'My Fresh Leads';
  return 'Company Fresh Leads';
}

function getScheduleBadgeLabel(viewMode: DashboardViewMode, name: string) {
  if (viewMode === 'preview') return `${name}'s Schedule`;
  if (viewMode === 'employee') return 'My Schedule';
  return 'Company Schedule';
}

export function DashboardHeroCards({ overview, isLoading }: DashboardHeroCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const viewMode = overview.viewMode || (overview.isPreview ? 'preview' : overview.isAdminView ? 'admin' : 'employee');
  const employeeName = overview.employee.name;

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg shadow-emerald-500/20 transition duration-200 hover:shadow-xl">
        <Star className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
              {getFreshLeadsLabel(viewMode, employeeName)}
            </p>
            <p className="mt-2 text-5xl font-bold tabular-nums">{overview.freshLeads}</p>
          </div>
          <Link
            href="/leads?status=new"
            className="inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/25 hover:shadow-md sm:self-auto"
          >
            View new leads <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide">Timeline Status</h3>
            <p className="text-xs text-muted-foreground">Follow-ups and visits by schedule</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase">
            {getScheduleBadgeLabel(viewMode, employeeName)}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatsCard
            title="Today"
            value={overview.timeline.unique?.today ?? overview.timeline.followUps.today + overview.timeline.visits.today}
            icon={Calendar}
            color="blue"
            description={`${overview.timeline.followUps.today} follow-ups · ${overview.timeline.visits.today} visits`}
            href="/leads?followUpDue=today"
          />
          <StatsCard
            title="Tomorrow"
            value={overview.timeline.unique?.tomorrow ?? overview.timeline.followUps.tomorrow + overview.timeline.visits.tomorrow}
            icon={CalendarClock}
            color="violet"
            description={`${overview.timeline.followUps.tomorrow} follow-ups · ${overview.timeline.visits.tomorrow} visits`}
            href="/leads?followUpDue=tomorrow"
          />
          <StatsCard
            title="Due / Overdue"
            value={overview.timeline.unique?.due ?? overview.timeline.followUps.due + overview.timeline.visits.due}
            icon={AlertCircle}
            color="orange"
            description={`${overview.timeline.followUps.due} follow-ups · ${overview.timeline.visits.due} visits`}
            href="/leads?followUpDue=overdue"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide">Thermal Quality</h3>
            <p className="text-xs text-muted-foreground">Active leads by temperature</p>
          </div>
          <Badge className="bg-amber-100 text-[10px] uppercase text-amber-700 hover:bg-amber-100">
            Lead temp
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatsCard
            title="Hot Leads"
            value={overview.thermal.hot}
            icon={Flame}
            color="rose"
            description="High intent — act first"
            href="/leads?priority=hot"
          />
          <StatsCard
            title="Warm Leads"
            value={overview.thermal.warm}
            icon={Sun}
            color="amber"
            description="Engaged prospects"
            href="/leads?priority=warm"
          />
          <StatsCard
            title="Cold Leads"
            value={overview.thermal.cold}
            icon={ThermometerSnowflake}
            color="sky"
            description="Early stage inquiries"
            href="/leads?priority=cold"
          />
        </div>
      </div>
    </div>
  );
}
