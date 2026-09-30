import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../utils/response.utils';

export const settingsController = {
  getLeadAssignment: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await settingsService.getLeadAssignment();
      sendSuccess(res, 'Lead assignment settings retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  updateLeadAssignment: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await settingsService.updateLeadAssignment(req.body);
      sendSuccess(res, 'Lead assignment settings updated', data?.leadAssignment);
    } catch (error) {
      next(error);
    }
  },
};
