'use client';

import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { RecentActivities } from '@/features/dashboard/components/RecentActivities';
import { DashboardKpiStrip } from '@/features/dashboard/components/DashboardKpiStrip';
import { TaskCardsSection } from '@/features/dashboard/components/TaskCardsSection';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboardOverview';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';

export function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();
  const { activities, isLoading: activitiesLoading } = useDashboard();

  const todayLabel = format(new Date(), 'EEEE, dd MMM');

  if (error && !isLoading) {
    return <ErrorState description="Failed to load dashboard" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description={`Your leads, schedule, and activity for ${user?.name || 'today'}.`}
      >
        <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
          <Clock className="h-3.5 w-3.5" />
          {todayLabel}
        </Badge>
      </PageHeader>

      <DashboardKpiStrip overview={overview} isLoading={isLoading} />
      <TaskCardsSection overview={overview} showSearch tabbed />
      <RecentActivities activities={activities} isLoading={activitiesLoading} />
    </div>
  );
}
