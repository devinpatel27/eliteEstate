import api from '@/lib/axios';
import { LoginCredentials, LoginResponse, ChangePasswordData } from '../types/auth.types';
import { ApiResponse } from '@/types/api.types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getProfile: async (): Promise<ApiResponse> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>('/auth/change-password', data);
    return response.data;
  },
};
