import { Request, Response, NextFunction } from 'express';
import { masterService } from './master.service';
import { sendSuccess, sendCreated } from '../../utils/response.utils';

export const propertyTypeController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activeOnly = req.query.active === 'true';
      const data = await masterService.listPropertyTypes(activeOnly);
      sendSuccess(res, 'Property types retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.getPropertyType(req.params.id);
      sendSuccess(res, 'Property type retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.createPropertyType(req.body);
      sendCreated(res, 'Property type created successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.updatePropertyType(req.params.id, req.body);
      sendSuccess(res, 'Property type updated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await masterService.deletePropertyType(req.params.id);
      sendSuccess(res, 'Property type deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

export const leadSourceController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activeOnly = req.query.active === 'true';
      const data = await masterService.listLeadSources(activeOnly);
      sendSuccess(res, 'Lead sources retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.getLeadSource(req.params.id);
      sendSuccess(res, 'Lead source retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.createLeadSource(req.body);
      sendCreated(res, 'Lead source created successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.updateLeadSource(req.params.id, req.body);
      sendSuccess(res, 'Lead source updated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await masterService.deleteLeadSource(req.params.id);
      sendSuccess(res, 'Lead source deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

export const followUpActivityController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activeOnly = req.query.active === 'true';
      const data = await masterService.listFollowUpActivities(activeOnly);
      sendSuccess(res, 'Follow-up activities retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.getFollowUpActivity(req.params.id);
      sendSuccess(res, 'Follow-up activity retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.createFollowUpActivity(req.body);
      sendCreated(res, 'Follow-up activity created successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await masterService.updateFollowUpActivity(req.params.id, req.body);
      sendSuccess(res, 'Follow-up activity updated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await masterService.deleteFollowUpActivity(req.params.id);
      sendSuccess(res, 'Follow-up activity deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
