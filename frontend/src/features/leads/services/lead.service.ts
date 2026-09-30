import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import {
  Lead,
  LeadListParams,
  CreateLeadData,
  LeadFollowUp,
  LeadActivity,
  LeadAssignment,
  MobileCheckResult,
} from '../types/lead.types';
import { FollowUpFormValues } from '../schemas/lead.schema';

function buildFollowUpPayload(data: FollowUpFormValues): Record<string, string> {
  const payload: Record<string, string> = {
    followUpDate: data.followUpDate,
    type: data.type,
    priority: data.priority,
  };
  if (data.status) payload.status = data.status;
  if (data.parentActivity?.trim()) payload.parentActivity = data.parentActivity.trim();
  if (data.childActivity?.trim()) payload.childActivity = data.childActivity.trim();
  if (data.remark?.trim()) payload.remark = data.remark.trim();
  if (data.nextFollowUpDate?.trim()) {
    const time = data.nextFollowUpTime?.trim() || '12:00';
    payload.nextFollowUpDate = `${data.nextFollowUpDate.trim()}T${time}:00`;
  }
  return payload;
}

export const leadService = {
  list: async (params: LeadListParams): Promise<PaginatedResponse<Lead>> => {
    const cleanParams: Record<string, unknown> = { ...params };
    if (cleanParams.status === 'all') delete cleanParams.status;
    if (cleanParams.priority === 'all') delete cleanParams.priority;
    if (cleanParams.category === 'all') delete cleanParams.category;
    if (cleanParams.propertyConfiguration === 'all') delete cleanParams.propertyConfiguration;
    if (cleanParams.followUpDue === 'all') delete cleanParams.followUpDue;
    const res = await api.get('/leads', { params: cleanParams });
    return res.data;
  },

  checkMobile: async (mobile: string): Promise<ApiResponse<MobileCheckResult>> => {
    const res = await api.get('/leads/check-mobile', { params: { mobile } });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Lead>> => {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },

  create: async (data: CreateLeadData): Promise<ApiResponse<Lead>> => {
    const res = await api.post('/leads', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateLeadData>): Promise<ApiResponse<Lead>> => {
    const res = await api.put(`/leads/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },

  updateStatus: async (id: string, data: { status: string; remark?: string }): Promise<ApiResponse<Lead>> => {
    const res = await api.patch(`/leads/${id}/status`, data);
    return res.data;
  },

  bulkUpdateStatus: async (
    leadIds: string[],
    status: string,
    remark?: string
  ): Promise<ApiResponse<{ modifiedCount: number; matchedCount: number; status: string }>> => {
    const res = await api.post('/leads/bulk-status', { leadIds, status, remark });
    return res.data;
  },

  transfer: async (id: string, data: { assignedTo: string; transferRemark: string }): Promise<ApiResponse<Lead>> => {
    const res = await api.post(`/leads/${id}/transfer`, data);
    return res.data;
  },

  getFollowUps: async (id: string): Promise<ApiResponse<LeadFollowUp[]>> => {
    const res = await api.get(`/leads/${id}/follow-ups`);
    return res.data;
  },

  createFollowUp: async (id: string, data: FollowUpFormValues): Promise<ApiResponse<LeadFollowUp>> => {
    const res = await api.post(`/leads/${id}/follow-ups`, buildFollowUpPayload(data));
    return res.data;
  },

  getActivities: async (id: string): Promise<ApiResponse<LeadActivity[]>> => {
    const res = await api.get(`/leads/${id}/activities`);
    return res.data;
  },

  getAssignments: async (id: string): Promise<ApiResponse<LeadAssignment[]>> => {
    const res = await api.get(`/leads/${id}/assignments`);
    return res.data;
  },

  addNote: async (id: string, text: string): Promise<ApiResponse<Lead>> => {
    const res = await api.post(`/leads/${id}/notes`, { text });
    return res.data;
  },
};
