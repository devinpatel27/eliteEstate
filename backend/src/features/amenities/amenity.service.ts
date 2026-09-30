import { amenityRepository } from './amenity.repository';
import { AppError } from '../../middleware/error.middleware';
import { CreateMasterInput, UpdateMasterInput } from '../masters/master.validator';

export const amenityService = {
  list: async (activeOnly = false) => amenityRepository.findAll(activeOnly),

  getById: async (id: string) => {
    const item = await amenityRepository.findById(id);
    if (!item) throw new AppError('Property amenity not found', 404);
    return item;
  },

  create: async (data: CreateMasterInput) => amenityRepository.create(data),

  update: async (id: string, data: UpdateMasterInput) => {
    const item = await amenityRepository.update(id, data);
    if (!item) throw new AppError('Property amenity not found', 404);
    return item;
  },

  delete: async (id: string) => {
    const item = await amenityRepository.delete(id);
    if (!item) throw new AppError('Property amenity not found', 404);
  },
};
