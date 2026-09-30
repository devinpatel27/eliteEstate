import api from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import { Role, CreateRoleData, UpdateRoleData } from '../types/role.types';

function normalizeRole(role: Role & { slug?: string; name?: string }): Role {
  const roleName =
    role.roleName ||
    role.slug ||
    role.name ||
    'unknown';

  return {
    ...role,
    roleName: String(roleName).trim().toLowerCase().replace(/\s+/g, '_'),
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
    status: role.status === 'inactive' ? 'inactive' : 'active',
    isSystem: Boolean(role.isSystem),
  };
}

export const roleService = {
  list: async (): Promise<ApiResponse<Role[]>> => {
    const res = await api.get('/roles');
    if (res.data?.data) {
      res.data.data = res.data.data.map(normalizeRole);
    }
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Role>> => {
    const res = await api.get(`/roles/${id}`);
    if (res.data?.data) {
      res.data.data = normalizeRole(res.data.data);
    }
    return res.data;
  },

  create: async (data: CreateRoleData): Promise<ApiResponse<Role>> => {
    const res = await api.post('/roles', data);
    return res.data;
  },

  update: async (id: string, data: UpdateRoleData): Promise<ApiResponse<Role>> => {
    const res = await api.put(`/roles/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/roles/${id}`);
    return res.data;
  },
};
