import { employeeRepository } from './employee.repository';
import { RoleModel } from '../../models/Role.model';
import { UserModel } from '../../models/User.model';
import { hashPassword } from '../../utils/bcrypt.utils';
import { generateEmployeeId } from '../../utils/employeeId.utils';
import { logActivity } from '../../utils/activityLogger';
import { AppError } from '../../middleware/error.middleware';
import { getPagination } from '../../utils/pagination.utils';
import { Request } from 'express';
import { CreateEmployeeInput, UpdateEmployeeInput } from './employee.validator';
import path from 'path';
import fs from 'fs';

export const employeeService = {
  listEmployees: async (req: Request) => {
    const { page, limit, skip } = getPagination(req);
    const { search, status, role, sortBy, sortOrder } = req.query as Record<string, string>;

    const { data, total } = await employeeRepository.findAll({
      skip,
      limit,
      search,
      status,
      role,
      sortBy,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });

    return { data, pagination: { page, limit, total } };
  },

  getEmployee: async (id: string) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);
    return employee;
  },

  createEmployee: async (
    data: CreateEmployeeInput,
    createdBy: string,
    profileImage?: string,
    ipAddress?: string
  ) => {
    const existing = await employeeRepository.findByEmail(data.email);
    if (existing) throw new AppError('An employee with this email already exists', 409);

    const roleExists = await RoleModel.findById(data.role);
    if (!roleExists) throw new AppError('Invalid role selected', 400);

    if (roleExists.roleName !== 'master_admin') {
      const masterRoles = await RoleModel.find({ roleName: 'master_admin' }).select('_id');
      const count = await UserModel.countDocuments({ role: { $nin: masterRoles.map(role => role._id) } });
      if (count >= 3) throw new AppError('Employee limit reached: maximum 3 employees, excluding Master Admin', 409);
    }

    const employeeId = await generateEmployeeId();
    const hashedPassword = await hashPassword(data.password);

    const employee = await employeeRepository.create({
      employeeId,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      password: hashedPassword,
      role: data.role as any,
      profileImage,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      status: data.status,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      forcePasswordChange: false,
      createdBy: createdBy as any,
    });

    await logActivity({
      userId: createdBy,
      action: 'CREATE_EMPLOYEE',
      module: 'EMPLOYEE',
      description: `Created employee: ${employee.name} (${employeeId})`,
      ipAddress,
    });

    return employeeRepository.findById(employee._id.toString());
  },

  updateEmployee: async (
    id: string,
    data: UpdateEmployeeInput,
    updatedBy: string,
    profileImage?: string,
    ipAddress?: string
  ) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    if (data.email && data.email !== employee.email) {
      const existing = await employeeRepository.findByEmail(data.email);
      if (existing) throw new AppError('This email is already in use', 409);
    }

    if (data.role) {
      const roleExists = await RoleModel.findById(data.role);
      if (!roleExists) throw new AppError('Invalid role selected', 400);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.joiningDate) updateData.joiningDate = new Date(data.joiningDate);
    if (profileImage) {
      if (employee.profileImage) {
        const oldPath = path.join(process.cwd(), employee.profileImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.profileImage = profileImage;
    }

    const updated = await employeeRepository.update(id, updateData as any);

    await logActivity({
      userId: updatedBy,
      action: 'UPDATE_EMPLOYEE',
      module: 'EMPLOYEE',
      description: `Updated employee: ${employee.name}`,
      ipAddress,
    });

    return updated;
  },

  deleteEmployee: async (id: string, deletedBy: string, ipAddress?: string) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    if (employee._id.toString() === deletedBy) {
      throw new AppError('You cannot delete your own account', 400);
    }

    if (employee.profileImage) {
      const imagePath = path.join(process.cwd(), employee.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await employeeRepository.delete(id);

    await logActivity({
      userId: deletedBy,
      action: 'DELETE_EMPLOYEE',
      module: 'EMPLOYEE',
      description: `Deleted employee: ${employee.name} (${employee.employeeId})`,
      ipAddress,
    });
  },

  updateStatus: async (
    id: string,
    status: 'active' | 'inactive',
    updatedBy: string,
    ipAddress?: string
  ) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    if (employee._id.toString() === updatedBy) {
      throw new AppError('You cannot change your own account status', 400);
    }

    const updated = await employeeRepository.update(id, { status } as any);

    await logActivity({
      userId: updatedBy,
      action: status === 'active' ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE',
      module: 'EMPLOYEE',
      description: `${status === 'active' ? 'Activated' : 'Deactivated'} employee: ${employee.name}`,
      ipAddress,
    });

    return updated;
  },

  resetPassword: async (
    id: string,
    newPassword: string,
    resetBy: string,
    ipAddress?: string
  ) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    const hashedPassword = await hashPassword(newPassword);
    await employeeRepository.update(id, {
      password: hashedPassword,
      forcePasswordChange: false,
    } as any);

    await logActivity({
      userId: resetBy,
      action: 'RESET_PASSWORD',
      module: 'EMPLOYEE',
      description: `Reset password for employee: ${employee.name} (${employee.employeeId})`,
      ipAddress,
    });
  },
};
