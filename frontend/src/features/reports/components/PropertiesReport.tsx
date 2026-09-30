'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Building2,
  ShoppingBag,
  Tag,
  Key,
  Globe,
  Star,
  CheckCircle2,
  Home,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable } from '@/components/common/DataTable';
import { KpiCardGrid } from './KpiCardGrid';
import { LazyReportPieChart, LazyReportBarChart } from './charts/LazyCharts';
import { usePropertiesReport, useReportFilters } from '../hooks/useReports';
import { formatDate } from '@/lib/utils';

interface TopPropertyRow {
  propertyName: string;
  views: number;
  inquiries: number;
  lastInquiryDate: string | null;
}

export function PropertiesReport() {
  const filters = useReportFilters();
  const { data, isLoading, error, refetch } = usePropertiesReport(filters);

  const columns = useMemo<ColumnDef<TopPropertyRow>[]>(
    () => [
      { accessorKey: 'propertyName', header: 'Property Name' },
      { accessorKey: 'views', header: 'Views' },
      { accessorKey: 'inquiries', header: 'Inquiries' },
      {
        accessorKey: 'lastInquiryDate',
        header: 'Last Inquiry Date',
        cell: ({ row }) => formatDate(row.original.lastInquiryDate),
      },
    ],
    []
  );

  if (error && !isLoading) {
    return <ErrorState description="Failed to load property report" onRetry={() => refetch()} />;
  }

  const kpis = [
    { title: 'Total Properties', value: data?.kpis.totalProperties ?? 0, icon: Building2, color: 'blue' as const },
    { title: 'Buy Properties', value: data?.kpis.buyProperties ?? 0, icon: ShoppingBag, color: 'emerald' as const },
    { title: 'Sell Properties', value: data?.kpis.sellProperties ?? 0, icon: Tag, color: 'violet' as const },
    { title: 'Rent Properties', value: data?.kpis.rentProperties ?? 0, icon: Key, color: 'amber' as const },
    { title: 'Published Properties', value: data?.kpis.publishedProperties ?? 0, icon: Globe, color: 'sky' as const },
    { title: 'Featured Properties', value: data?.kpis.featuredProperties ?? 0, icon: Star, color: 'orange' as const },
    { title: 'Sold Properties', value: data?.kpis.soldProperties ?? 0, icon: CheckCircle2, color: 'rose' as const },
    { title: 'Rented Properties', value: data?.kpis.rentedProperties ?? 0, icon: Home, color: 'emerald' as const },
  ];

  const pieData =
    data?.purposeDistribution.map((p) => ({ name: p.name, value: p.count })) ?? [];

  const websiteKpis = [
    {
      title: 'Total Property Views',
      value: data?.websiteAnalytics.totalPropertyViews ?? 0,
      icon: Eye,
      color: 'blue' as const,
    },
    {
      title: 'Total Property Inquiries',
      value: data?.websiteAnalytics.totalPropertyInquiries ?? 0,
      icon: MessageSquare,
      color: 'emerald' as const,
    },
    {
      title: 'Featured Property Views',
      value: data?.websiteAnalytics.featuredPropertyViews ?? 0,
      icon: Star,
      color: 'amber' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <KpiCardGrid items={kpis} isLoading={isLoading} columns={4} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LazyReportPieChart title="Property Distribution (Buy / Sell / Rent)" data={pieData} />
        <LazyReportBarChart title="Property Type Report" data={data?.propertyTypeReport ?? []} />
      </div>

      <Card className="crm-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Website Property Analytics</h3>
        <KpiCardGrid items={websiteKpis} isLoading={isLoading} columns={3} />
      </Card>

      <Card className="crm-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Top Viewed Properties</h3>
        <DataTable
          columns={columns}
          data={data?.topViewedProperties ?? []}
          isLoading={isLoading}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
