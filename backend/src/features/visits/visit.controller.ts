import { Request, Response, NextFunction } from 'express';
import { visitService } from './visit.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.utils';
import { getPagination } from '../../utils/pagination.utils';

export const visitController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = getPagination(req);
      const { search, type, status, favorite, dateFrom, dateTo, sortBy, sortOrder } = req.query;

      const { data, total } = await visitService.list(req.user!, {
        skip,
        limit,
        search: search as string,
        type: type as string,
        status: status as string,
        favorite: favorite === 'true' ? true : favorite === 'false' ? false : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      sendPaginated(res, 'Visits retrieved successfully', data, { page, limit, total });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visit = await visitService.getById(req.params.id, req.user!);
      sendSuccess(res, 'Visit retrieved successfully', visit);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visit = await visitService.create(req.body, req.user!, req.ip);
      sendCreated(res, 'Visit created successfully', visit);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visit = await visitService.update(req.params.id, req.body, req.user!, req.ip);
      sendSuccess(res, 'Visit updated successfully', visit);
    } catch (error) {
      next(error);
    }
  },

  toggleFavorite: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visit = await visitService.toggleFavorite(req.params.id, req.user!);
      sendSuccess(res, 'Favorite updated successfully', visit);
    } catch (error) {
      next(error);
    }
  },

  addHistory: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await visitService.addHistory(req.params.id, req.body, req.user!);
      sendSuccess(res, 'Visit history added successfully', history);
    } catch (error) {
      next(error);
    }
  },
};
