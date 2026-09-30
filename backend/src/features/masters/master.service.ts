import { masterRepository } from './master.repository';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateFollowUpActivityInput,
  CreateMasterInput,
  UpdateFollowUpActivityInput,
  UpdateMasterInput,
} from './master.validator';

export const masterService = {
  listPropertyTypes: async (activeOnly = false) =>
    masterRepository.findAllPropertyTypes(activeOnly),

  getPropertyType: async (id: string) => {
    const item = await masterRepository.findPropertyTypeById(id);
    if (!item) throw new AppError('Property type not found', 404);
    return item;
  },

  createPropertyType: async (data: CreateMasterInput) =>
    masterRepository.createPropertyType(data),

  updatePropertyType: async (id: string, data: UpdateMasterInput) => {
    const item = await masterRepository.updatePropertyType(id, data);
    if (!item) throw new AppError('Property type not found', 404);
    return item;
  },

  deletePropertyType: async (id: string) => {
    const item = await masterRepository.deletePropertyType(id);
    if (!item) throw new AppError('Property type not found', 404);
  },

  listLeadSources: async (activeOnly = false) =>
    masterRepository.findAllLeadSources(activeOnly),

  getLeadSource: async (id: string) => {
    const item = await masterRepository.findLeadSourceById(id);
    if (!item) throw new AppError('Lead source not found', 404);
    return item;
  },

  createLeadSource: async (data: CreateMasterInput) =>
    masterRepository.createLeadSource(data),

  updateLeadSource: async (id: string, data: UpdateMasterInput) => {
    const item = await masterRepository.updateLeadSource(id, data);
    if (!item) throw new AppError('Lead source not found', 404);
    return item;
  },

  deleteLeadSource: async (id: string) => {
    const item = await masterRepository.deleteLeadSource(id);
    if (!item) throw new AppError('Lead source not found', 404);
  },

  listFollowUpActivities: async (activeOnly = false) =>
    masterRepository.findAllFollowUpActivities(activeOnly),

  getFollowUpActivity: async (id: string) => {
    const item = await masterRepository.findFollowUpActivityById(id);
    if (!item) throw new AppError('Follow-up activity not found', 404);
    return item;
  },

  createFollowUpActivity: async (data: CreateFollowUpActivityInput) =>
    masterRepository.createFollowUpActivity({ ...data, parent: data.parent || undefined }),

  updateFollowUpActivity: async (id: string, data: UpdateFollowUpActivityInput) => {
    const item = await masterRepository.updateFollowUpActivity(id, data);
    if (!item) throw new AppError('Follow-up activity not found', 404);
    return item;
  },

  deleteFollowUpActivity: async (id: string) => {
    const item = await masterRepository.deleteFollowUpActivity(id);
    if (!item) throw new AppError('Follow-up activity not found', 404);
  },
};
