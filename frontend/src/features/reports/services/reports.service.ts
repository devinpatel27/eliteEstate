import api from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import {
  EmployeesReportData,
  LeadsReportData,
  OverviewReportData,
  PropertiesReportData,
  ReportFilters,
  ReportType,
  VisitsReportData,
} from '../types/reports.types';

function buildParams(filters: ReportFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.leadSourceId) params.leadSourceId = filters.leadSourceId;
  if (filters.propertyTypeId) params.propertyTypeId = filters.propertyTypeId;
  if (filters.category) params.category = filters.category;
  return params;
}

export const reportsService = {
  getOverview: async (filters: ReportFilters = {}): Promise<ApiResponse<OverviewReportData>> => {
    const res = await api.get('/reports/overview', { params: buildParams(filters) });
    return res.data;
  },

  getLeads: async (filters: ReportFilters = {}): Promise<ApiResponse<LeadsReportData>> => {
    const res = await api.get('/reports/leads', { params: buildParams(filters) });
    return res.data;
  },

  getEmployees: async (filters: ReportFilters = {}): Promise<ApiResponse<EmployeesReportData>> => {
    const res = await api.get('/reports/employees', { params: buildParams(filters) });
    return res.data;
  },

  getProperties: async (filters: ReportFilters = {}): Promise<ApiResponse<PropertiesReportData>> => {
    const res = await api.get('/reports/properties', { params: buildParams(filters) });
    return res.data;
  },

  getVisits: async (filters: ReportFilters = {}): Promise<ApiResponse<VisitsReportData>> => {
    const res = await api.get('/reports/visits', { params: buildParams(filters) });
    return res.data;
  },

  exportReport: async (
    report: ReportType,
    format: 'csv' | 'xlsx',
    filters: ReportFilters = {}
  ): Promise<Blob> => {
    const res = await api.get('/reports/export', {
      params: { ...buildParams(filters), report, format },
      responseType: 'blob',
    });
    return res.data;
  },
};
