'use client';

import {
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { KpiCardGrid } from './KpiCardGrid';
import { LazyReportLineChart, LazyReportPieChart } from './charts/LazyCharts';
import { useVisitsReport, useReportFilters } from '../hooks/useReports';

export function VisitsReport() {
  const filters = useReportFilters();
  const { data, isLoading, error, refetch } = useVisitsReport(filters);

  if (error && !isLoading) {
    return <ErrorState description="Failed to load visit report" onRetry={() => refetch()} />;
  }

  const kpis = [
    { title: 'Total Visits', value: data?.kpis.totalVisits ?? 0, icon: MapPin, color: 'blue' as const },
    { title: 'Scheduled Visits', value: data?.kpis.scheduledVisits ?? 0, icon: Calendar, color: 'sky' as const },
    { title: 'Completed Visits', value: data?.kpis.completedVisits ?? 0, icon: CheckCircle2, color: 'emerald' as const },
    { title: 'Cancelled Visits', value: data?.kpis.cancelledVisits ?? 0, icon: XCircle, color: 'rose' as const },
    { title: 'Re-Visits', value: data?.kpis.reVisits ?? 0, icon: RotateCcw, color: 'violet' as const },
  ];

  const pieData =
    data?.statusDistribution.map((s) => ({ name: s.label, value: s.count })) ?? [];

  return (
    <div className="space-y-6">
      <KpiCardGrid items={kpis} isLoading={isLoading} columns={3} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LazyReportLineChart
          title="Visit Trend (Last 12 Months)"
          data={data?.monthlyTrend ?? []}
          color="#10b981"
        />
        <LazyReportPieChart title="Visit Status Report" data={pieData} />
      </div>
    </div>
  );
}
