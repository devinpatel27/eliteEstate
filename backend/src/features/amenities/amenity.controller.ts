import { Request, Response, NextFunction } from 'express';
import { amenityService } from './amenity.service';
import { sendSuccess, sendCreated } from '../../utils/response.utils';

export const amenityController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activeOnly = req.query.active === 'true';
      const data = await amenityService.list(activeOnly);
      sendSuccess(res, 'Property amenities retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await amenityService.getById(req.params.id);
      sendSuccess(res, 'Property amenity retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await amenityService.create(req.body);
      sendCreated(res, 'Property amenity created successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await amenityService.update(req.params.id, req.body);
      sendSuccess(res, 'Property amenity updated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await amenityService.delete(req.params.id);
      sendSuccess(res, 'Property amenity deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
