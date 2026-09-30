import { PropertyAmenityModel } from '../../models/PropertyAmenity.model';

const toSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

export const amenityRepository = {
  findAll: async (activeOnly = false) => {
    const query = activeOnly ? { status: 'active' } : {};
    return PropertyAmenityModel.find(query).sort({ sortOrder: 1, name: 1 }).lean();
  },

  findById: async (id: string) => PropertyAmenityModel.findById(id),

  create: async (data: { name?: string; status?: string; sortOrder?: number }) => {
    const name = data.name || '';
    const slug = toSlug(name);
    return PropertyAmenityModel.create({ ...data, name, slug });
  },

  update: async (id: string, data: { name?: string; status?: string; sortOrder?: number }) => {
    const update = { ...data };
    if (data.name) (update as { slug?: string }).slug = toSlug(data.name);
    return PropertyAmenityModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  delete: async (id: string) => PropertyAmenityModel.findByIdAndDelete(id),
};
