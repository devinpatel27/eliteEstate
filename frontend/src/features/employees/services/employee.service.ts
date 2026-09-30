import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { Employee, EmployeeListParams } from '../types/employee.types';

export const employeeService = {
  list: async (params: EmployeeListParams = {}): Promise<PaginatedResponse<Employee>> => {
    const res = await api.get('/employees', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Employee>> => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  create: async (formData: FormData): Promise<ApiResponse<Employee>> => {
    const res = await api.post('/employees', formData);
    return res.data;
  },

  update: async (id: string, formData: FormData): Promise<ApiResponse<Employee>> => {
    const res = await api.put(`/employees/${id}`, formData);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  },

  updateStatus: async (
    id: string,
    status: 'active' | 'inactive'
  ): Promise<ApiResponse<Employee>> => {
    const res = await api.patch(`/employees/${id}/status`, { status });
    return res.data;
  },

  resetPassword: async (id: string, newPassword: string): Promise<ApiResponse> => {
    const res = await api.patch(`/employees/${id}/reset-password`, { newPassword });
    return res.data;
  },
};
