import { Request, Response, NextFunction } from 'express';
import { leadService } from './lead.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.utils';
import { getPagination } from '../../utils/pagination.utils';
import { isLeadAdmin } from './lead.access';
import { AppError } from '../../middleware/error.middleware';

export const leadController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = getPagination(req);
      const { search, status, category, priority, propertyType, propertyConfiguration, leadSource, assignedTo, sortBy, sortOrder, dateFrom, dateTo, nfdFrom, nfdTo, followUpDue } =
        req.query;

      const { data, total } = await leadService.list(req.user!, {
        skip,
        limit,
        search: search as string,
        status: status as string,
        category: category as string,
        priority: priority as string,
        propertyType: propertyType as string,
        propertyConfiguration: propertyConfiguration as string,
        leadSource: leadSource as string,
        assignedTo: assignedTo as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        nfdFrom: nfdFrom as string,
        nfdTo: nfdTo as string,
        followUpDue: followUpDue as 'today' | 'tomorrow' | 'overdue',
      });

      sendPaginated(res, 'Leads retrieved successfully', data, { page, limit, total });
    } catch (error) {
      next(error);
    }
  },

  checkMobile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await leadService.checkMobile(req.query.mobile as string, req.user!);
      sendSuccess(res, 'Mobile check completed', result);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await leadService.getById(req.params.id, req.user!);
      sendSuccess(res, 'Lead retrieved successfully', lead);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.body.assignedTo && !isLeadAdmin(req.user!.permissions)) throw new AppError('Only an admin can assign leads', 403);
      const lead = await leadService.create(req.body, req.user!.userId, req.ip);
      sendCreated(res, 'Lead created successfully', lead);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await leadService.update(req.params.id, req.body, req.user!, req.ip);
      sendSuccess(res, 'Lead updated successfully', lead);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await leadService.delete(req.params.id, req.user!, req.ip);
      sendSuccess(res, 'Lead deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await leadService.updateStatus(req.params.id, req.body, req.user!, req.ip);
      sendSuccess(res, 'Lead status updated successfully', lead);
    } catch (error) {
      next(error);
    }
  },

  bulkUpdateStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await leadService.bulkUpdateStatus(req.body, req.user!, req.ip);
      sendSuccess(res, 'Leads status updated successfully', result);
    } catch (error) {
      next(error);
    }
  },

  transfer: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await leadService.transfer(req.params.id, req.body, req.user!, req.ip);
      sendSuccess(res, 'Lead transferred successfully', lead);
    } catch (error) {
      next(error);
    }
  },

  getFollowUps: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const followUps = await leadService.getFollowUps(req.params.id, req.user!);
      sendSuccess(res, 'Follow-ups retrieved successfully', followUps);
    } catch (error) {
      next(error);
    }
  },

  createFollowUp: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const followUp = await leadService.createFollowUp(req.params.id, req.body, req.user!, req.ip);
      sendCreated(res, 'Follow-up added successfully', followUp);
    } catch (error) {
      next(error);
    }
  },

  getActivities: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activities = await leadService.getActivities(req.params.id, req.user!);
      sendSuccess(res, 'Activities retrieved successfully', activities);
    } catch (error) {
      next(error);
    }
  },

  getAssignments: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await leadService.getAssignments(req.params.id, req.user!);
      sendSuccess(res, 'Assignment history retrieved successfully', assignments);
    } catch (error) {
      next(error);
    }
  },

  addNote: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await leadService.addNote(req.params.id, req.body, req.user!, req.ip);
      sendSuccess(res, 'Note added successfully', lead);
    } catch (error) {
      next(error);
    }
  },
};
