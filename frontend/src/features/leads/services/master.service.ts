import api from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import { FollowUpActivity, MasterItem } from '../types/lead.types';

export const masterService = {
  listPropertyTypes: async (activeOnly = false): Promise<ApiResponse<MasterItem[]>> => {
    const res = await api.get('/property-types', { params: activeOnly ? { active: 'true' } : {} });
    return res.data;
  },

  createPropertyType: async (data: { name: string; status?: string }): Promise<ApiResponse<MasterItem>> => {
    const res = await api.post('/property-types', data);
    return res.data;
  },

  updatePropertyType: async (id: string, data: Partial<MasterItem>): Promise<ApiResponse<MasterItem>> => {
    const res = await api.put(`/property-types/${id}`, data);
    return res.data;
  },

  deletePropertyType: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/property-types/${id}`);
    return res.data;
  },

  listLeadSources: async (activeOnly = false): Promise<ApiResponse<MasterItem[]>> => {
    const res = await api.get('/lead-sources', { params: activeOnly ? { active: 'true' } : {} });
    return res.data;
  },

  createLeadSource: async (data: { name: string; status?: string }): Promise<ApiResponse<MasterItem>> => {
    const res = await api.post('/lead-sources', data);
    return res.data;
  },

  updateLeadSource: async (id: string, data: Partial<MasterItem>): Promise<ApiResponse<MasterItem>> => {
    const res = await api.put(`/lead-sources/${id}`, data);
    return res.data;
  },

  deleteLeadSource: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/lead-sources/${id}`);
    return res.data;
  },

  listFollowUpActivities: async (activeOnly = false): Promise<ApiResponse<FollowUpActivity[]>> => {
    const res = await api.get('/follow-up-activities', { params: activeOnly ? { active: 'true' } : {} });
    return res.data;
  },

  createFollowUpActivity: async (data: { name: string; parent?: string; status?: string }): Promise<ApiResponse<FollowUpActivity>> => {
    const res = await api.post('/follow-up-activities', data);
    return res.data;
  },

  updateFollowUpActivity: async (id: string, data: Partial<FollowUpActivity>): Promise<ApiResponse<FollowUpActivity>> => {
    const res = await api.put(`/follow-up-activities/${id}`, data);
    return res.data;
  },

  deleteFollowUpActivity: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/follow-up-activities/${id}`);
    return res.data;
  },
};
