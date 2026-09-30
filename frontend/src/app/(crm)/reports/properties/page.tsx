'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportActionBar } from '@/features/reports/components/ReportActionBar';
import { PropertiesReport } from '@/features/reports/components/PropertiesReport';
import { useReportFilters } from '@/features/reports/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';

function PropertiesPageContent() {
  const filters = useReportFilters();

  return (
    <>
      <PageHeader
        title="Property Reports"
        description="Property inventory, distribution, and website analytics."
      >
        <ReportActionBar reportType="properties" filters={filters} />
      </PageHeader>
      <PropertiesReport />
    </>
  );
}

export default function PropertiesReportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <PropertiesPageContent />
    </Suspense>
  );
}
