'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportActionBar } from '@/features/reports/components/ReportActionBar';
import { VisitsReport } from '@/features/reports/components/VisitsReport';
import { useReportFilters } from '@/features/reports/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';

function VisitsPageContent() {
  const filters = useReportFilters();

  return (
    <>
      <PageHeader
        title="Visit Reports"
        description="Visit KPIs, monthly trends, and status breakdown."
      >
        <ReportActionBar reportType="visits" filters={filters} />
      </PageHeader>
      <VisitsReport />
    </>
  );
}

export default function VisitsReportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <VisitsPageContent />
    </Suspense>
  );
}
