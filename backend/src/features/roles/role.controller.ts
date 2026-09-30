import { Request, Response, NextFunction } from 'express';
import { roleService } from './role.service';
import { sendSuccess, sendCreated } from '../../utils/response.utils';

export const roleController = {
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await roleService.getAllRoles();
      sendSuccess(res, 'Roles retrieved successfully', roles);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await roleService.getRoleById(req.params.id);
      sendSuccess(res, 'Role retrieved successfully', role);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      const role = await roleService.createRole(req.body, userId, ipAddress);
      sendCreated(res, 'Role created successfully', role);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      const role = await roleService.updateRole(req.params.id, req.body, userId, ipAddress);
      sendSuccess(res, 'Role updated successfully', role);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip;
      await roleService.deleteRole(req.params.id, userId, ipAddress);
      sendSuccess(res, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
