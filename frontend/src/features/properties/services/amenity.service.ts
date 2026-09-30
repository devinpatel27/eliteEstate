import api from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import { MasterItem } from '@/features/leads/types/lead.types';
import { LeadAssignmentSettings } from '../types/property.types';

export const amenityService = {
  list: async (activeOnly = false): Promise<ApiResponse<MasterItem[]>> => {
    const res = await api.get('/property-amenities', { params: activeOnly ? { active: true } : {} });
    return res.data;
  },

  create: async (data: { name: string }): Promise<ApiResponse<MasterItem>> => {
    const res = await api.post('/property-amenities', data);
    return res.data;
  },

  update: async (id: string, data: { name: string }): Promise<ApiResponse<MasterItem>> => {
    const res = await api.put(`/property-amenities/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/property-amenities/${id}`);
    return res.data;
  },
};

export const settingsService = {
  getLeadAssignment: async (): Promise<ApiResponse<LeadAssignmentSettings>> => {
    const res = await api.get('/settings/lead-assignment');
    return res.data;
  },

  updateLeadAssignment: async (data: {
    mode: 'manual' | 'round_robin';
    roundRobinEmployeeIds?: string[];
  }): Promise<ApiResponse<LeadAssignmentSettings>> => {
    const res = await api.put('/settings/lead-assignment', data);
    return res.data;
  },
};
