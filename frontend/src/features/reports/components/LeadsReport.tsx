'use client';

import {
  Target,
  Phone,
  RefreshCw,
  Flame,
  Thermometer,
  Snowflake,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/common/ErrorState';
import { KpiCardGrid } from './KpiCardGrid';
import { LazyReportLineChart, LazyReportPieChart } from './charts/LazyCharts';
import { useLeadsReport, useReportFilters } from '../hooks/useReports';

export function LeadsReport() {
  const filters = useReportFilters();
  const { data, isLoading, error, refetch } = useLeadsReport(filters);

  if (error && !isLoading) {
    return <ErrorState description="Failed to load lead report" onRetry={() => refetch()} />;
  }

  const kpis = [
    { title: 'New Leads', value: data?.kpis.newLeads ?? 0, icon: Target, color: 'blue' as const },
    { title: 'Contacted Leads', value: data?.kpis.contactedLeads ?? 0, icon: Phone, color: 'sky' as const },
    { title: 'Follow-up Leads', value: data?.kpis.followUpLeads ?? 0, icon: RefreshCw, color: 'violet' as const },
    { title: 'Hot Leads', value: data?.kpis.hotLeads ?? 0, icon: Flame, color: 'rose' as const },
    { title: 'Warm Leads', value: data?.kpis.warmLeads ?? 0, icon: Thermometer, color: 'amber' as const },
    { title: 'Cold Leads', value: data?.kpis.coldLeads ?? 0, icon: Snowflake, color: 'blue' as const },
    { title: 'Closed Won', value: data?.kpis.closedWon ?? 0, icon: Trophy, color: 'emerald' as const },
    { title: 'Closed Lost', value: data?.kpis.closedLost ?? 0, icon: XCircle, color: 'orange' as const },
  ];

  const pieData =
    data?.statusDistribution.map((s) => ({ name: s.label, value: s.count })) ?? [];

  return (
    <div className="space-y-6">
      <KpiCardGrid items={kpis} isLoading={isLoading} columns={4} />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Lead Conversion Rate</span>
        <Badge variant="secondary" className="text-base font-bold tabular-nums">
          {isLoading ? '—' : `${data?.conversionRate ?? 0}%`}
        </Badge>
      </div>

      <Card className="crm-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Lead Source Performance</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.leadSourcePerformance ?? []).map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
            >
              <span className="text-sm text-muted-foreground">{s.name}</span>
              <span className="text-lg font-bold tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <LazyReportPieChart title="Lead Status Distribution" data={pieData} />
        <LazyReportLineChart title="Monthly Lead Trend (Last 12 Months)" data={data?.monthlyTrend ?? []} />
      </div>
    </div>
  );
}
