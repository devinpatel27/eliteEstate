'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const chartSkeleton = () => <Skeleton className="h-[340px] w-full rounded-xl" />;

export const LazyReportLineChart = dynamic(
  () => import('./ReportLineChart').then((m) => ({ default: m.ReportLineChart })),
  { ssr: false, loading: chartSkeleton }
);

export const LazyReportPieChart = dynamic(
  () => import('./ReportPieChart').then((m) => ({ default: m.ReportPieChart })),
  { ssr: false, loading: chartSkeleton }
);

export const LazyReportBarChart = dynamic(
  () => import('./ReportBarChart').then((m) => ({ default: m.ReportBarChart })),
  { ssr: false, loading: chartSkeleton }
);
