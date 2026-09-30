import { Request, Response, NextFunction } from 'express';
import { propertyService } from './property.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.utils';
import { getPagination } from '../../utils/pagination.utils';

export const propertyController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = getPagination(req);
      const { search, purpose, status, propertyType, publishOnWebsite, isFeatured, city, sortBy, sortOrder } =
        req.query;

      const { data, total } = await propertyService.list({
        skip,
        limit,
        search: search as string,
        purpose: purpose as string,
        status: status as string,
        propertyType: propertyType as string,
        publishOnWebsite:
          publishOnWebsite === 'true' ? true : publishOnWebsite === 'false' ? false : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        city: city as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      sendPaginated(res, 'Properties retrieved successfully', data, { page, limit, total });
    } catch (error) {
      next(error);
    }
  },

  dashboard: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyService.getDashboard();
      sendSuccess(res, 'Property dashboard retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyService.getById(req.params.id);
      sendSuccess(res, 'Property retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyService.create(req.body, req.user!.userId, req.ip);
      sendCreated(res, 'Property created successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyService.update(req.params.id, req.body, req.user!.userId, req.ip);
      sendSuccess(res, 'Property updated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await propertyService.delete(req.params.id, req.user!.userId, req.ip);
      sendSuccess(res, 'Property deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  togglePublish: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyService.togglePublish(req.params.id, req.user!.userId);
      sendSuccess(res, 'Property publish status updated', data);
    } catch (error) {
      next(error);
    }
  },

  toggleFeature: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyService.toggleFeature(req.params.id, req.user!.userId);
      sendSuccess(res, 'Property featured status updated', data);
    } catch (error) {
      next(error);
    }
  },

  uploadMedia: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const mediaType = (req.body.mediaType || 'gallery') as 'featured' | 'gallery' | 'video' | 'floorplan';
      const data = await propertyService.uploadMedia(
        req.params.id,
        req.file,
        mediaType,
        req.body.title,
        req.user!.userId
      );
      sendSuccess(res, 'Media uploaded successfully', data);
    } catch (error) {
      next(error);
    }
  },

  deleteMedia: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyService.deleteMedia(req.params.id, req.params.mediaId, req.user!.userId);
      sendSuccess(res, 'Media deleted successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getInquiries: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = getPagination(req);
      const { data, total } = await propertyService.getInquiries(req.params.id, skip, limit);
      sendPaginated(res, 'Property inquiries retrieved successfully', data, { page, limit, total });
    } catch (error) {
      next(error);
    }
  },
};
