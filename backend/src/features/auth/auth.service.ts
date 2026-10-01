import { authRepository } from './auth.repository';
import { comparePassword, hashPassword } from '../../utils/bcrypt.utils';
import { signToken } from '../../utils/jwt.utils';
import { logActivity } from '../../utils/activityLogger';
import { AppError } from '../../middleware/error.middleware';
import { IRole } from '../../models/Role.model';
import { LoginInput, ChangePasswordInput } from './auth.validator';

export const authService = {
  login: async (data: LoginInput, ipAddress?: string) => {
    if (data.email.trim().toLowerCase() === 'demo@eliteestate.com') {
      throw new AppError('Invalid email or password', 401);
    }

    const user = await authRepository.findByEmail(data.email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === 'inactive') {
      throw new AppError('Your account is inactive. Please contact the administrator.', 403);
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    await authRepository.updateLastLogin(user._id.toString());

    const role = user.role as unknown as IRole;
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: role.roleName,
      roleId: role._id.toString(),
      permissions: role.permissions,
    });

    await logActivity({
      userId: user._id.toString(),
      action: 'LOGIN',
      module: 'AUTH',
      description: `User logged in from ${ipAddress || 'unknown'}`,
      ipAddress,
    });

    return {
      token,
      user: {
        _id: user._id,
        employeeId: user.employeeId || 'EMP000',
        name: user.name || user.email.split('@')[0],
        email: user.email,
        role: role.roleName,
        roleId: role._id,
        permissions: role.permissions,
        profileImage: user.profileImage,
        forcePasswordChange: user.forcePasswordChange,
      },
      forcePasswordChange: user.forcePasswordChange,
    };
  },

  getProfile: async (userId: string) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const role = user.role as unknown as IRole;
    return {
      _id: user._id,
      employeeId: user.employeeId || 'EMP000',
      name: user.name || user.email.split('@')[0],
      email: user.email,
      mobile: user.mobile,
      role: role.roleName,
      roleId: role._id,
      permissions: role.permissions,
      profileImage: user.profileImage,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      joiningDate: user.joiningDate,
      status: user.status,
      lastLogin: user.lastLogin,
      forcePasswordChange: user.forcePasswordChange,
    };
  },

  changePassword: async (
    userId: string,
    data: ChangePasswordInput,
    ipAddress?: string
  ) => {
    const user = await authRepository.findByIdWithPassword(userId);
    if (!user) throw new AppError('User not found', 404);

    const isCurrentValid = await comparePassword(data.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    if (data.currentPassword === data.newPassword) {
      throw new AppError('New password must be different from the current password', 400);
    }

    const hashedPassword = await hashPassword(data.newPassword);
    await authRepository.updatePassword(userId, hashedPassword);

    await logActivity({
      userId,
      action: 'CHANGE_PASSWORD',
      module: 'AUTH',
      description: 'Password changed successfully',
      ipAddress,
    });
  },
};
