'use client';

import {
  Target,
  Activity,
  CheckCircle2,
  Building2,
  Home,
  MapPin,
  Users,
} from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { KpiCardGrid } from './KpiCardGrid';
import { useOverviewReport, useReportFilters } from '../hooks/useReports';

export function OverviewReport() {
  const filters = useReportFilters();
  const { data, isLoading, error, refetch } = useOverviewReport(filters);

  if (error && !isLoading) {
    return <ErrorState description="Failed to load overview report" onRetry={() => refetch()} />;
  }

  const items = [
    { title: 'Total Leads', value: data?.totalLeads ?? 0, icon: Target, color: 'blue' as const },
    { title: 'Active Leads', value: data?.activeLeads ?? 0, icon: Activity, color: 'emerald' as const },
    { title: 'Closed Leads', value: data?.closedLeads ?? 0, icon: CheckCircle2, color: 'violet' as const },
    { title: 'Total Properties', value: data?.totalProperties ?? 0, icon: Building2, color: 'orange' as const },
    { title: 'Active Properties', value: data?.activeProperties ?? 0, icon: Home, color: 'sky' as const },
    { title: 'Total Visits', value: data?.totalVisits ?? 0, icon: MapPin, color: 'amber' as const },
    { title: 'Completed Visits', value: data?.completedVisits ?? 0, icon: CheckCircle2, color: 'emerald' as const },
    { title: 'Total Employees', value: data?.totalEmployees ?? 0, icon: Users, color: 'rose' as const },
  ];

  return <KpiCardGrid items={items} isLoading={isLoading} columns={4} />;
}
