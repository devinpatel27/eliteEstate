'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportActionBar } from '@/features/reports/components/ReportActionBar';
import { OverviewReport } from '@/features/reports/components/OverviewReport';
import { useReportFilters } from '@/features/reports/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';

function OverviewPageContent() {
  const filters = useReportFilters();

  return (
    <>
      <PageHeader
        title="Overview Analytics"
        description="High-level KPIs across leads, properties, visits, and employees."
      >
        <ReportActionBar reportType="overview" filters={filters} />
      </PageHeader>
      <OverviewReport />
    </>
  );
}

export default function OverviewReportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <OverviewPageContent />
    </Suspense>
  );
}
