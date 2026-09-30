'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import {
  DashboardOverview,
  EmployeePerformanceData,
  EmployeeLeadStreamItem,
  FollowUpJourneyItem,
} from '../types/dashboard.types';

export function useDashboardOverview(employeeId?: string, enabled = true) {
  return useQuery({
    queryKey: ['dashboard-overview', employeeId || 'self'],
    queryFn: async () => {
      const res = await dashboardService.getOverview(employeeId);
      if (!res.success || !res.data) throw new Error('Failed to load dashboard');
      return res.data as DashboardOverview;
    },
    enabled,
    staleTime: 120_000,
  });
}

export function useEmployeePerformance(enabled = true) {
  return useQuery({
    queryKey: ['employee-performance'],
    queryFn: async () => {
      const res = await dashboardService.getEmployeePerformance();
      if (!res.success || !res.data) throw new Error('Failed to load performance');
      return res.data as EmployeePerformanceData;
    },
    enabled,
    staleTime: 120_000,
  });
}

export function useEmployeeLeadStream(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-lead-stream', employeeId],
    queryFn: async () => {
      const res = await dashboardService.getEmployeeLeadStream(employeeId!);
      if (!res.success) throw new Error('Failed to load leads');
      return (res.data || []) as EmployeeLeadStreamItem[];
    },
    enabled: Boolean(employeeId),
  });
}

export function useLeadFollowUpJourney(leadId?: string) {
  return useQuery({
    queryKey: ['lead-follow-up-journey', leadId],
    queryFn: async () => {
      const res = await dashboardService.getLeadFollowUpJourney(leadId!);
      if (!res.success) throw new Error('Failed to load follow-ups');
      return (res.data || []) as FollowUpJourneyItem[];
    },
    enabled: Boolean(leadId),
  });
}

export function useLeadStatsForFilters() {
  return useQuery({
    queryKey: ['dashboard-lead-stats-filters'],
    queryFn: async () => {
      const res = await dashboardService.getLeadStats();
      return res.success ? res.data : null;
    },
    staleTime: 60_000,
  });
}
