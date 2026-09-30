'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { ROUTES, PERMISSIONS } from '@/lib/constants';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { GlobalReportFilters } from '@/features/reports/components/GlobalReportFilters';
import { Skeleton } from '@/components/ui/skeleton';

const reportTabs = [
  { label: 'Overview Analytics', href: ROUTES.REPORTS_OVERVIEW },
  { label: 'Lead Reports', href: ROUTES.REPORTS_LEADS },
  { label: 'Employee Performance', href: ROUTES.REPORTS_EMPLOYEES },
  { label: 'Property Reports', href: ROUTES.REPORTS_PROPERTIES },
  { label: 'Visit Reports', href: ROUTES.REPORTS_VISITS },
];

function FiltersFallback() {
  return <Skeleton className="h-24 w-full rounded-xl" />;
}

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PermissionGuard permission={PERMISSIONS.REPORT_READ} redirectTo="/dashboard">
      <div className="reports-layout space-y-6">
      <nav className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-card p-1 print:hidden">
        {reportTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === tab.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <Suspense fallback={<FiltersFallback />}>
        <GlobalReportFilters />
      </Suspense>

      <div className="report-content">{children}</div>
      </div>
    </PermissionGuard>
  );
}
