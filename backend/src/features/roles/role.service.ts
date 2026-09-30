import { roleRepository } from './role.repository';
import { logActivity } from '../../utils/activityLogger';
import { AppError } from '../../middleware/error.middleware';
import { normalizeRoleDoc } from '../../utils/role.utils';
import { CreateRoleInput, UpdateRoleInput } from './role.validator';

export const roleService = {
  getAllRoles: async () => {
    const roles = await roleRepository.findAll();
    return roles.map((role) => normalizeRoleDoc(role));
  },

  getRoleById: async (id: string) => {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    return normalizeRoleDoc(role);
  },

  createRole: async (
    data: CreateRoleInput,
    userId: string,
    ipAddress?: string
  ) => {
    const existing = await roleRepository.findByName(data.roleName);
    if (existing) throw new AppError('A role with this name already exists', 409);

    const role = await roleRepository.create(data);

    await logActivity({
      userId,
      action: 'CREATE_ROLE',
      module: 'ROLE',
      description: `Created role: ${role.roleName}`,
      ipAddress,
    });

    return role;
  },

  updateRole: async (
    id: string,
    data: UpdateRoleInput,
    userId: string,
    ipAddress?: string
  ) => {
    const existing = await roleRepository.findById(id);
    if (!existing) throw new AppError('Role not found', 404);

    if (existing.isSystem && data.roleName && data.roleName !== existing.roleName) {
      throw new AppError('Cannot rename system roles', 400);
    }

    if (
      existing.isSystem &&
      existing.roleName === 'master_admin' &&
      data.permissions &&
      !data.permissions.includes('*')
    ) {
      throw new AppError('Cannot modify master admin permissions', 400);
    }

    const role = await roleRepository.update(id, data);

    await logActivity({
      userId,
      action: 'UPDATE_ROLE',
      module: 'ROLE',
      description: `Updated role: ${existing.roleName}`,
      ipAddress,
    });

    return role;
  },

  deleteRole: async (id: string, userId: string, ipAddress?: string) => {
    const existing = await roleRepository.findById(id);
    if (!existing) throw new AppError('Role not found', 404);

    if (existing.isSystem) {
      throw new AppError('System roles cannot be deleted', 400);
    }

    await roleRepository.delete(id);

    await logActivity({
      userId,
      action: 'DELETE_ROLE',
      module: 'ROLE',
      description: `Deleted role: ${existing.roleName}`,
      ipAddress,
    });
  },
};
