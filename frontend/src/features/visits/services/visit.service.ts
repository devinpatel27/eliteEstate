import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { Visit, VisitDetail, VisitHistory, VisitListParams, CreateVisitData } from '../types/visit.types';

export const visitService = {
  list: async (params: VisitListParams): Promise<PaginatedResponse<Visit>> => {
    const query = {
      ...params,
      favorite: params.favorite === undefined ? undefined : String(params.favorite),
    };
    const res = await api.get('/visits', { params: query });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<VisitDetail>> => {
    const res = await api.get(`/visits/${id}`);
    return res.data;
  },

  create: async (data: CreateVisitData): Promise<ApiResponse<Visit>> => {
    const res = await api.post('/visits', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateVisitData & { status: string }>): Promise<ApiResponse<Visit>> => {
    const res = await api.patch(`/visits/${id}`, data);
    return res.data;
  },

  toggleFavorite: async (id: string): Promise<ApiResponse<Visit>> => {
    const res = await api.patch(`/visits/${id}/favorite`);
    return res.data;
  },

  addHistory: async (id: string, data: { action?: string; remark: string }): Promise<ApiResponse<VisitHistory[]>> => {
    const res = await api.post(`/visits/${id}/history`, data);
    return res.data;
  },
};
