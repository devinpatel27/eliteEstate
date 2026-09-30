import api from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import {
  DashboardStats,
  ActivityLog,
  LatestEmployee,
  LeadDashboardStats,
  DashboardOverview,
  EmployeePerformanceData,
  EmployeeLeadStreamItem,
  FollowUpJourneyItem,
} from '../types/dashboard.types';

export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  getRecentActivity: async (): Promise<ApiResponse<ActivityLog[]>> => {
    const res = await api.get('/dashboard/recent-activity');
    return res.data;
  },

  getLatestEmployees: async (): Promise<ApiResponse<LatestEmployee[]>> => {
    const res = await api.get('/dashboard/latest-employees');
    return res.data;
  },

  getLeadStats: async (): Promise<ApiResponse<LeadDashboardStats>> => {
    const res = await api.get('/dashboard/lead-stats');
    return res.data;
  },

  getOverview: async (employeeId?: string): Promise<ApiResponse<DashboardOverview>> => {
    const res = await api.get('/dashboard/overview', {
      params: employeeId ? { employeeId } : undefined,
    });
    return res.data;
  },

  getEmployeePerformance: async (): Promise<ApiResponse<EmployeePerformanceData>> => {
    const res = await api.get('/dashboard/employee-performance');
    return res.data;
  },

  getEmployeeLeadStream: async (employeeId: string): Promise<ApiResponse<EmployeeLeadStreamItem[]>> => {
    const res = await api.get(`/dashboard/employees/${employeeId}/leads`);
    return res.data;
  },

  getLeadFollowUpJourney: async (leadId: string): Promise<ApiResponse<FollowUpJourneyItem[]>> => {
    const res = await api.get(`/dashboard/leads/${leadId}/follow-up-journey`);
    return res.data;
  },
};
