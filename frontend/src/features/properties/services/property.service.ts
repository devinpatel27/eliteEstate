import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import {
  Property,
  PropertyDashboardStats,
  PropertyListParams,
  CreatePropertyData,
  PropertyInquiry,
} from '../types/property.types';

export const propertyService = {
  list: async (params: PropertyListParams): Promise<PaginatedResponse<Property>> => {
    const res = await api.get('/properties', { params });
    return res.data;
  },

  getDashboard: async (): Promise<ApiResponse<PropertyDashboardStats>> => {
    const res = await api.get('/properties/dashboard');
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Property>> => {
    const res = await api.get(`/properties/${id}`);
    return res.data;
  },

  create: async (data: CreatePropertyData): Promise<ApiResponse<Property>> => {
    const res = await api.post('/properties', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreatePropertyData>): Promise<ApiResponse<Property>> => {
    const res = await api.put(`/properties/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/properties/${id}`);
    return res.data;
  },

  togglePublish: async (id: string): Promise<ApiResponse<Property>> => {
    const res = await api.patch(`/properties/${id}/publish`);
    return res.data;
  },

  toggleFeature: async (id: string): Promise<ApiResponse<Property>> => {
    const res = await api.patch(`/properties/${id}/feature`);
    return res.data;
  },

  uploadMedia: async (
    id: string,
    file: File,
    mediaType: 'featured' | 'gallery' | 'video' | 'floorplan',
    title?: string
  ): Promise<ApiResponse<Property>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);
    if (title) formData.append('title', title);
    const res = await api.post(`/properties/${id}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteMedia: async (id: string, mediaId: string): Promise<ApiResponse<Property>> => {
    const res = await api.delete(`/properties/${id}/media/${mediaId}`);
    return res.data;
  },

  getInquiries: async (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<PropertyInquiry>> => {
    const res = await api.get(`/properties/${id}/inquiries`, { params });
    return res.data;
  },
};
