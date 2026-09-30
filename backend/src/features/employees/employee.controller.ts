import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.utils';

export const employeeController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { data, pagination } = await employeeService.listEmployees(req);
      sendPaginated(res, 'Employees retrieved successfully', data, pagination);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await employeeService.getEmployee(req.params.id);
      sendSuccess(res, 'Employee retrieved successfully', employee);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      const profileImage = req.file
        ? `uploads/profiles/${req.file.filename}`
        : undefined;
      const employee = await employeeService.createEmployee(
        req.body,
        userId,
        profileImage,
        ipAddress
      );
      sendCreated(res, 'Employee created successfully', employee);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      const profileImage = req.file
        ? `uploads/profiles/${req.file.filename}`
        : undefined;
      const employee = await employeeService.updateEmployee(
        req.params.id,
        req.body,
        userId,
        profileImage,
        ipAddress
      );
      sendSuccess(res, 'Employee updated successfully', employee);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      await employeeService.deleteEmployee(req.params.id, userId, ipAddress);
      sendSuccess(res, 'Employee deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      const employee = await employeeService.updateStatus(
        req.params.id,
        req.body.status,
        userId,
        ipAddress
      );
      sendSuccess(res, 'Employee status updated successfully', employee);
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      await employeeService.resetPassword(
        req.params.id,
        req.body.newPassword,
        userId,
        ipAddress
      );
      sendSuccess(res, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  },
};
