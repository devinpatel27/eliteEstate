'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { DashboardStats, ActivityLog, LatestEmployee, LeadDashboardStats } from '../types/dashboard.types';

export function useDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [statsRes, activitiesRes, employeesRes, leadStatsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getLatestEmployees(),
        dashboardService.getLeadStats().catch(() => ({ success: false as const, message: '' })),
      ]);

      return {
        stats: statsRes.success ? (statsRes.data as DashboardStats) : null,
        activities: activitiesRes.success ? (activitiesRes.data as ActivityLog[]) : [],
        latestEmployees: employeesRes.success ? (employeesRes.data as LatestEmployee[]) : [],
        leadStats:
          leadStatsRes.success && leadStatsRes.data
            ? (leadStatsRes.data as LeadDashboardStats)
            : null,
      };
    },
    staleTime: 120_000,
  });

  return {
    stats: data?.stats ?? null,
    activities: data?.activities ?? [],
    latestEmployees: data?.latestEmployees ?? [],
    leadStats: data?.leadStats ?? null,
    isLoading: isLoading && !data,
    isFetching,
    error: error ? 'Failed to load dashboard data' : null,
    refetch,
  };
}
