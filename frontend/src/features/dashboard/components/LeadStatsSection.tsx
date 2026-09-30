import { Target, Flame, Thermometer, Snowflake, Calendar, CalendarDays, AlertCircle, Trophy, XCircle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { LeadDashboardStats } from '../types/dashboard.types';

interface LeadStatsSectionProps {
  stats: LeadDashboardStats | null;
  isLoading?: boolean;
}

export function LeadStatsSection({ stats, isLoading }: LeadStatsSectionProps) {
  if (!stats && !isLoading) return null;

  const totalLabel = stats?.isAdminView ? 'Total Leads' : 'My Leads';

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Lead Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard title={totalLabel} value={stats?.totalLeads ?? 0} icon={Target} color="blue" isLoading={isLoading} />
        <StatsCard title="New Leads" value={stats?.newLeads ?? 0} icon={Target} color="blue" isLoading={isLoading} />
        <StatsCard title="Hot Leads" value={stats?.hotLeads ?? 0} icon={Flame} color="rose" isLoading={isLoading} />
        <StatsCard title="Warm Leads" value={stats?.warmLeads ?? 0} icon={Thermometer} color="amber" isLoading={isLoading} />
        <StatsCard title="Cold Leads" value={stats?.coldLeads ?? 0} icon={Snowflake} color="blue" isLoading={isLoading} />
        <StatsCard title="Today's Follow-Ups" value={stats?.todayFollowUps ?? 0} icon={Calendar} color="emerald" isLoading={isLoading} />
        <StatsCard title="Tomorrow's Follow-Ups" value={stats?.tomorrowFollowUps ?? 0} icon={CalendarDays} color="blue" isLoading={isLoading} />
        <StatsCard title="Overdue Follow-Ups" value={stats?.overdueFollowUps ?? 0} icon={AlertCircle} color="rose" isLoading={isLoading} />
        {stats?.isAdminView && (
          <>
            <StatsCard title="Closed Won" value={stats?.closedWon ?? 0} icon={Trophy} color="emerald" isLoading={isLoading} />
            <StatsCard title="Closed Lost" value={stats?.closedLost ?? 0} icon={XCircle} color="rose" isLoading={isLoading} />
          </>
        )}
      </div>
    </div>
  );
}
