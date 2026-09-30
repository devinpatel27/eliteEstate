'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportActionBar } from '@/features/reports/components/ReportActionBar';
import { EmployeesReport } from '@/features/reports/components/EmployeesReport';
import { useReportFilters } from '@/features/reports/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';

function EmployeesPageContent() {
  const filters = useReportFilters();

  return (
    <>
      <PageHeader
        title="Employee Performance"
        description="Team performance metrics, rankings, and conversion rates."
      >
        <ReportActionBar reportType="employees" filters={filters} />
      </PageHeader>
      <EmployeesReport />
    </>
  );
}

export default function EmployeesReportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <EmployeesPageContent />
    </Suspense>
  );
}
