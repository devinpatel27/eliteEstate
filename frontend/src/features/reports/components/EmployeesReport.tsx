'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Trophy, TrendingUp, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable } from '@/components/common/DataTable';
import { useEmployeesReport, useReportFilters } from '../hooks/useReports';
import { EmployeePerformanceRow } from '../types/reports.types';

export function EmployeesReport() {
  const filters = useReportFilters();
  const { data, isLoading, error, refetch } = useEmployeesReport(filters);

  const columns = useMemo<ColumnDef<EmployeePerformanceRow>[]>(
    () => [
      { accessorKey: 'name', header: 'Employee Name' },
      { accessorKey: 'assignedLeads', header: 'Assigned Leads' },
      { accessorKey: 'callsDone', header: 'Calls Done' },
      { accessorKey: 'followUpsAdded', header: 'Follow-ups Added' },
      { accessorKey: 'visitsScheduled', header: 'Visits Scheduled' },
      { accessorKey: 'visitsCompleted', header: 'Visits Completed' },
      { accessorKey: 'closedLeads', header: 'Closed Leads' },
      {
        accessorKey: 'conversionRate',
        header: 'Conversion %',
        cell: ({ row }) => `${row.original.conversionRate}%`,
      },
    ],
    []
  );

  if (error && !isLoading) {
    return (
      <ErrorState description="Failed to load employee performance report" onRetry={() => refetch()} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <TopPerformersCard
          title="Top by Closed Leads"
          icon={Trophy}
          items={data?.topPerformers.byClosedLeads ?? []}
          metric={(e) => `${e.closedLeads} closed`}
          isLoading={isLoading}
        />
        <TopPerformersCard
          title="Top by Conversion %"
          icon={TrendingUp}
          items={data?.topPerformers.byConversion ?? []}
          metric={(e) => `${e.conversionRate}%`}
          isLoading={isLoading}
        />
        <TopPerformersCard
          title="Top by Visits Completed"
          icon={MapPin}
          items={data?.topPerformers.byVisitsCompleted ?? []}
          metric={(e) => `${e.visitsCompleted} visits`}
          isLoading={isLoading}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.employees ?? []}
        isLoading={isLoading}
        pageSize={20}
      />
    </div>
  );
}

function TopPerformersCard({
  title,
  icon: Icon,
  items,
  metric,
  isLoading,
}: {
  title: string;
  icon: typeof Trophy;
  items: EmployeePerformanceRow[];
  metric: (e: EmployeePerformanceRow) => string;
  isLoading?: boolean;
}) {
  return (
    <Card className="crm-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <ol className="space-y-2">
          {items.map((emp, idx) => (
            <li key={emp._id} className="flex items-center justify-between text-sm">
              <span>
                <span className="mr-2 font-medium text-muted-foreground">{idx + 1}.</span>
                {emp.name}
              </span>
              <span className="font-semibold tabular-nums">{metric(emp)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
