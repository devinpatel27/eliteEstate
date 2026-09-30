import { UserModel, IUser } from '../../models/User.model';

export const authRepository = {
  findByEmail: async (email: string): Promise<IUser | null> => {
    return UserModel.findOne({ email: email.trim().toLowerCase() })
      .select('+password')
      .populate('role', 'roleName permissions');
  },

  findById: async (id: string): Promise<IUser | null> => {
    return UserModel.findById(id).populate('role', 'roleName permissions');
  },

  findByIdWithPassword: async (id: string): Promise<IUser | null> => {
    return UserModel.findById(id)
      .select('+password')
      .populate('role', 'roleName permissions');
  },

  updateLastLogin: async (userId: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, { lastLogin: new Date() });
  },

  updatePassword: async (userId: string, hashedPassword: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      forcePasswordChange: false,
    });
  },
};
