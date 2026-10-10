import { UserModel, IUser } from '../../models/User.model';
import { FilterQuery } from 'mongoose';

interface ListOptions {
  skip: number;
  limit: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const employeeRepository = {
  findAll: async (options: ListOptions) => {
    const query: FilterQuery<IUser> = {};

    if (options.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { mobile: { $regex: options.search, $options: 'i' } },
        { employeeId: { $regex: options.search, $options: 'i' } },
      ];
    }

    if (options.status) query.status = options.status;
    if (options.role) query.role = options.role;

    const sortField = options.sortBy || 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      UserModel.find(query)
        .populate('role', 'roleName permissions')
        .populate('createdBy', 'name')
        .sort({ [sortField]: sortDir })
        .skip(options.skip)
        .limit(options.limit),
      UserModel.countDocuments(query),
    ]);

    return { data, total };
  },

  findById: async (id: string): Promise<IUser | null> => {
    return UserModel.findById(id)
      .populate('role', 'roleName permissions')
      .populate('createdBy', 'name email');
  },

  findByEmail: async (email: string): Promise<IUser | null> => {
    return UserModel.findOne({ email: email.toLowerCase() });
  },

  create: async (data: Partial<IUser>): Promise<IUser> => {
    return UserModel.create(data);
  },

  update: async (id: string, data: Partial<IUser>): Promise<IUser | null> => {
    return UserModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      'role',
      'roleName'
    );
  },

  delete: async (id: string): Promise<IUser | null> => {
    return UserModel.findByIdAndDelete(id);
  },

  countByStatus: async () => {
    const [active, inactive, total] = await Promise.all([
      UserModel.countDocuments({ status: 'active' }),
      UserModel.countDocuments({ status: 'inactive' }),
      UserModel.countDocuments(),
    ]);
    return { active, inactive, total };
  },

  countTodayLogins: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return UserModel.countDocuments({ lastLogin: { $gte: today } });
  },
};
