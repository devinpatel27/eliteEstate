'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { RecentActivities } from '@/features/dashboard/components/RecentActivities';
import { DashboardKpiStrip } from '@/features/dashboard/components/DashboardKpiStrip';
import { EmployeePerformanceBoard } from '@/features/dashboard/components/EmployeePerformanceBoard';
import { EmployeeDashboardSelector } from '@/features/dashboard/components/EmployeeDashboardSelector';
import { EmployeeDashboardPreview } from '@/features/dashboard/components/EmployeeDashboardPreview';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboardOverview';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardReportsCharts = dynamic(
  () =>
    import('@/features/dashboard/components/DashboardReportsCharts').then((m) => ({
      default: m.DashboardReportsCharts,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[720px] w-full rounded-xl" />,
  }
);

export function AdminDashboard() {
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();
  const { activities, isLoading: activitiesLoading } = useDashboard();
  const [previewEmployeeId, setPreviewEmployeeId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const todayLabel = format(new Date(), 'EEEE, dd MMM');

  const handlePreviewEmployee = (employeeId: string) => {
    setPreviewEmployeeId(employeeId);
    setPreviewOpen(true);
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setTimeout(() => {
      document.getElementById('employee-workboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (error && !isLoading) {
    return <ErrorState description="Failed to load dashboard" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Overview"
        description="Company-wide KPIs, employee performance, and drill-down workboards."
      >
        <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
          <Clock className="h-3.5 w-3.5" />
          {todayLabel}
        </Badge>
      </PageHeader>

      <DashboardKpiStrip overview={overview} isLoading={isLoading} />

      <EmployeeDashboardSelector
        selectedEmployeeId={selectedEmployeeId}
        onSelectEmployee={setSelectedEmployeeId}
      />

      <EmployeePerformanceBoard
        onPreviewEmployee={handlePreviewEmployee}
        onSelectEmployee={handleSelectEmployee}
      />

      <DashboardReportsCharts />

      <RecentActivities activities={activities} isLoading={activitiesLoading} />

      <EmployeeDashboardPreview
        employeeId={previewEmployeeId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
