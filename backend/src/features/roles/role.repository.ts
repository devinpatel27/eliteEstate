import { RoleModel, IRole } from '../../models/Role.model';
import { CreateRoleInput, UpdateRoleInput } from './role.validator';

export const roleRepository = {
  findAll: async (): Promise<IRole[]> => {
    return RoleModel.find().sort({ isSystem: -1, createdAt: -1 });
  },

  findById: async (id: string): Promise<IRole | null> => {
    return RoleModel.findById(id);
  },

  findByName: async (name: string): Promise<IRole | null> => {
    return RoleModel.findOne({ roleName: name });
  },

  create: async (data: CreateRoleInput): Promise<IRole> => {
    return RoleModel.create(data);
  },

  update: async (id: string, data: UpdateRoleInput): Promise<IRole | null> => {
    return RoleModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  delete: async (id: string): Promise<IRole | null> => {
    return RoleModel.findByIdAndDelete(id);
  },
};
