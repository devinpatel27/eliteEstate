import type { QueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { leadService } from '@/features/leads/services/lead.service';
import { visitService } from '@/features/visits/services/visit.service';
import { employeeService } from '@/features/employees/services/employee.service';
import { propertyService } from '@/features/properties/services/property.service';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@/lib/constants';

const DEFAULT_LIST = { page: 1, limit: 10 };

function canReadAllLeads(permissions: string[]) {
  return permissions.includes(PERMISSIONS.WILDCARD) || permissions.includes(PERMISSIONS.LEAD_READ);
}

export function prefetchRouteData(queryClient: QueryClient, href: string) {
  const user = useAuthStore.getState().user;
  const permissions = user?.permissions ?? [];

  if (href === '/dashboard') {
    void queryClient.prefetchQuery({
      queryKey: ['dashboard-overview', 'self'],
      queryFn: async () => {
        const res = await dashboardService.getOverview();
        if (!res.success || !res.data) throw new Error('Failed to load dashboard');
        return res.data;
      },
      staleTime: 120_000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: async () => {
        const [statsRes, activitiesRes, employeesRes, leadStatsRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivity(),
          dashboardService.getLatestEmployees(),
          dashboardService.getLeadStats().catch(() => ({ success: false as const, message: '' })),
        ]);
        return {
          stats: statsRes.success ? statsRes.data : null,
          activities: activitiesRes.success ? activitiesRes.data ?? [] : [],
          latestEmployees: employeesRes.success ? employeesRes.data ?? [] : [],
          leadStats: leadStatsRes.success ? leadStatsRes.data ?? null : null,
        };
      },
      staleTime: 120_000,
    });
    if (permissions.includes(PERMISSIONS.WILDCARD) || permissions.includes(PERMISSIONS.LEAD_READ)) {
      void queryClient.prefetchQuery({
        queryKey: ['employee-performance'],
        queryFn: async () => {
          const res = await dashboardService.getEmployeePerformance();
          if (!res.success || !res.data) throw new Error('Failed to load performance');
          return res.data;
        },
        staleTime: 120_000,
      });
    }
    return;
  }

  if (href === '/leads') {
    const assignedOnly = Boolean(user && !canReadAllLeads(permissions));
    void queryClient.prefetchQuery({
      queryKey: ['leads', DEFAULT_LIST, assignedOnly, user?._id],
      queryFn: async () => {
        const res = await leadService.list(DEFAULT_LIST);
        if (!res.success) throw new Error('Failed to load leads');
        let leads = res.data || [];
        if (assignedOnly && user?._id) {
          leads = leads.filter((lead) => lead.assignedTo?._id === user._id);
        }
        return {
          leads,
          totalCount: res.pagination?.total || 0,
          pageCount: res.pagination?.totalPages || 1,
        };
      },
      staleTime: 120_000,
    });
    return;
  }

  if (href === '/visits') {
    void queryClient.prefetchQuery({
      queryKey: ['visits', DEFAULT_LIST],
      queryFn: async () => {
        const res = await visitService.list(DEFAULT_LIST);
        if (!res.success) throw new Error('Failed to load visits');
        return {
          visits: res.data || [],
          totalCount: res.pagination?.total || 0,
          pageCount: res.pagination?.totalPages || 1,
        };
      },
      staleTime: 120_000,
    });
    return;
  }

  if (href === '/employees') {
    void queryClient.prefetchQuery({
      queryKey: ['employees', DEFAULT_LIST],
      queryFn: async () => {
        const res = await employeeService.list(DEFAULT_LIST);
        if (!res.success) throw new Error('Failed to load employees');
        return {
          employees: res.data,
          totalCount: res.pagination.total,
          pageCount: res.pagination.totalPages,
        };
      },
      staleTime: 120_000,
    });
    return;
  }

  if (href === '/properties') {
    const listParams = { page: 1, limit: 10, search: '' };
    void queryClient.prefetchQuery({
      queryKey: ['properties', listParams],
      queryFn: async () => {
        const res = await propertyService.list({
          page: listParams.page,
          limit: listParams.limit,
        });
        if (!res.success) throw new Error('Failed to load properties');
        return {
          properties: res.data || [],
          totalCount: res.pagination?.total || 0,
          pageCount: res.pagination?.totalPages || 1,
        };
      },
      staleTime: 120_000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['properties-dashboard'],
      queryFn: async () => {
        const res = await propertyService.getDashboard();
        if (!res.success) throw new Error('Failed to load property stats');
        return res.data;
      },
      staleTime: 120_000,
    });
  }
}
