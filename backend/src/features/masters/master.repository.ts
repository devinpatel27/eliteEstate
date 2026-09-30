import { PropertyTypeModel } from '../../models/PropertyType.model';
import { LeadSourceModel } from '../../models/LeadSource.model';
import { FollowUpActivityModel } from '../../models/FollowUpActivity.model';

const toSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

export const masterRepository = {
  findAllPropertyTypes: async (activeOnly = false) => {
    const query = activeOnly ? { status: 'active' } : {};
    return PropertyTypeModel.find(query).sort({ sortOrder: 1, name: 1 }).lean();
  },

  findPropertyTypeById: async (id: string) => PropertyTypeModel.findById(id),

  createPropertyType: async (data: { name?: string; status?: string; sortOrder?: number }) => {
    const name = data.name || '';
    const slug = toSlug(name);
    return PropertyTypeModel.create({ ...data, name, slug });
  },

  updatePropertyType: async (id: string, data: { name?: string; status?: string; sortOrder?: number }) => {
    const update = { ...data };
    if (data.name) (update as { slug?: string }).slug = toSlug(data.name);
    return PropertyTypeModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  deletePropertyType: async (id: string) => PropertyTypeModel.findByIdAndDelete(id),

  findAllLeadSources: async (activeOnly = false) => {
    const query = activeOnly ? { status: 'active' } : {};
    return LeadSourceModel.find(query).sort({ sortOrder: 1, name: 1 }).lean();
  },

  findLeadSourceById: async (id: string) => LeadSourceModel.findById(id),

  createLeadSource: async (data: { name?: string; status?: string; sortOrder?: number }) => {
    const name = data.name || '';
    const slug = toSlug(name);
    return LeadSourceModel.create({ ...data, name, slug });
  },

  updateLeadSource: async (id: string, data: { name?: string; status?: string; sortOrder?: number }) => {
    const update = { ...data };
    if (data.name) (update as { slug?: string }).slug = toSlug(data.name);
    return LeadSourceModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  deleteLeadSource: async (id: string) => LeadSourceModel.findByIdAndDelete(id),

  findAllFollowUpActivities: async (activeOnly = false) => {
    const query = activeOnly ? { status: 'active' } : {};
    const items = await FollowUpActivityModel.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    const parents = items.filter((item) => !item.parent);
    const children = items.filter((item) => item.parent);

    return parents.map((parent) => ({
      ...parent,
      children: children.filter((child) => String(child.parent) === String(parent._id)),
    }));
  },

  findFollowUpActivityById: async (id: string) => FollowUpActivityModel.findById(id),

  createFollowUpActivity: async (data: { name?: string; parent?: string; status?: string; sortOrder?: number }) => {
    const name = data.name || '';
    const slug = toSlug(name);
    const parent = data.parent || undefined;
    return FollowUpActivityModel.create({ ...data, name, parent, slug });
  },

  updateFollowUpActivity: async (id: string, data: { name?: string; parent?: string; status?: string; sortOrder?: number }) => {
    const update = { ...data };
    if (data.name) (update as { slug?: string }).slug = toSlug(data.name);
    if (data.parent === '') (update as { parent?: undefined }).parent = undefined;
    return FollowUpActivityModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  deleteFollowUpActivity: async (id: string) => {
    await FollowUpActivityModel.deleteMany({ parent: id });
    return FollowUpActivityModel.findByIdAndDelete(id);
  },
};
