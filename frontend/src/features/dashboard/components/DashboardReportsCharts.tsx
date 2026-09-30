'use client';

import { useLeadsReport, useEmployeesReport, usePropertiesReport } from '@/features/reports/hooks/useReports';
import { LazyReportLineChart, LazyReportPieChart } from '@/features/reports/components/charts/LazyCharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardReportsCharts() {
  const emptyFilters = {};
  const { data: leadsData, isLoading: leadsLoading } = useLeadsReport(emptyFilters);
  const { data: propertiesData, isLoading: propertiesLoading } = usePropertiesReport(emptyFilters);
  const { data: employeesData, isLoading: employeesLoading } = useEmployeesReport(emptyFilters);

  const statusPie =
    leadsData?.statusDistribution.map((s) => ({ name: s.label, value: s.count })) ?? [];

  const purposePie =
    propertiesData?.purposeDistribution.map((p) => ({ name: p.name, value: p.count })) ?? [];

  const topEmployees = employeesData?.topPerformers.byClosedLeads ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Reports Snapshot</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {leadsLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <LazyReportLineChart
            title="Monthly Lead Trend"
            data={leadsData?.monthlyTrend ?? []}
          />
        )}

        {leadsLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <LazyReportPieChart title="Lead Status Distribution" data={statusPie} />
        )}

        {propertiesLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <LazyReportPieChart title="Property Distribution" data={purposePie} />
        )}

        {employeesLoading ? (
          <Skeleton className="h-[340px] w-full rounded-xl" />
        ) : (
          <Card className="crm-card p-5">
            <h3 className="mb-4 text-sm font-semibold">Employee Performance Ranking</h3>
            {topEmployees.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No data available</p>
            ) : (
              <ol className="space-y-3">
                {topEmployees.map((emp, idx) => (
                  <li
                    key={emp._id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{emp.name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold tabular-nums">{emp.closedLeads} closed</p>
                      <p className="text-muted-foreground">{emp.conversionRate}% conversion</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
