'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportActionBar } from '@/features/reports/components/ReportActionBar';
import { LeadsReport } from '@/features/reports/components/LeadsReport';
import { useReportFilters } from '@/features/reports/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';

function LeadsPageContent() {
  const filters = useReportFilters();

  return (
    <>
      <PageHeader
        title="Lead Reports"
        description="Lead KPIs, source performance, conversion rate, and trends."
      >
        <ReportActionBar reportType="leads" filters={filters} />
      </PageHeader>
      <LeadsReport />
    </>
  );
}

export default function LeadsReportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <LeadsPageContent />
    </Suspense>
  );
}
