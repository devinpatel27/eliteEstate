'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { reportsService } from '../services/reports.service';
import { ReportFilters, ReportType } from '../types/reports.types';

export function useReportFilters(): ReportFilters {
  const searchParams = useSearchParams();
  return useMemo(
    () => ({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      leadSourceId: searchParams.get('leadSourceId') || undefined,
      propertyTypeId: searchParams.get('propertyTypeId') || undefined,
      category: searchParams.get('category') || undefined,
    }),
    [searchParams]
  );
}

export function useOverviewReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'overview', filters],
    queryFn: async () => {
      const res = await reportsService.getOverview(filters);
      if (!res.success) throw new Error('Failed to load overview report');
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export function useLeadsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'leads', filters],
    queryFn: async () => {
      const res = await reportsService.getLeads(filters);
      if (!res.success) throw new Error('Failed to load leads report');
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export function useEmployeesReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'employees', filters],
    queryFn: async () => {
      const res = await reportsService.getEmployees(filters);
      if (!res.success) throw new Error('Failed to load employees report');
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export function usePropertiesReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'properties', filters],
    queryFn: async () => {
      const res = await reportsService.getProperties(filters);
      if (!res.success) throw new Error('Failed to load properties report');
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export function useVisitsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'visits', filters],
    queryFn: async () => {
      const res = await reportsService.getVisits(filters);
      if (!res.success) throw new Error('Failed to load visits report');
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export function useReportExport() {
  return async (report: ReportType, format: 'csv' | 'xlsx', filters: ReportFilters) => {
    const blob = await reportsService.exportReport(report, format, filters);
    const ext = format === 'csv' ? 'csv' : 'xlsx';
    const { downloadBlob } = await import('@/lib/utils');
    downloadBlob(blob, `${report}-report.${ext}`);
  };
}
