import { Request, Response, NextFunction } from 'express';
import { employeeRepository } from '../employees/employee.repository';
import { ActivityLogModel } from '../../models/ActivityLog.model';
import { UserModel } from '../../models/User.model';
import { sendSuccess } from '../../utils/response.utils';
import { leadService } from '../leads/lead.service';
import { dashboardService } from './dashboard.service';
import { requiresAssignedOnlyScope } from '../leads/lead.access';
import { toObjectId } from '../../utils/objectId.utils';

export const dashboardController = {
  getStats: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [counts, todayLogins] = await Promise.all([
        employeeRepository.countByStatus(),
        employeeRepository.countTodayLogins(),
      ]);

      sendSuccess(res, 'Dashboard stats retrieved', {
        totalEmployees: counts.total,
        activeEmployees: counts.active,
        inactiveEmployees: counts.inactive,
        todayLogins,
      });
    } catch (error) {
      next(error);
    }
  },

  getRecentActivity: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query =
        requiresAssignedOnlyScope(req.user!.permissions) && toObjectId(req.user!.userId)
          ? { user: toObjectId(req.user!.userId) }
          : {};

      const activities = await ActivityLogModel.find(query)
        .populate('user', 'name employeeId profileImage')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      sendSuccess(res, 'Recent activity retrieved', activities);
    } catch (error) {
      next(error);
    }
  },

  getLatestEmployees: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employees = await UserModel.find()
        .populate('role', 'roleName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      sendSuccess(res, 'Latest employees retrieved', employees);
    } catch (error) {
      next(error);
    }
  },

  getLeadStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await leadService.getLeadStats(req.user!);
      sendSuccess(res, 'Lead stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  },

  getOverview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const data = await dashboardService.getOverview(req.user!, employeeId);
      sendSuccess(res, 'Dashboard overview retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  getEmployeePerformance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await dashboardService.getEmployeePerformance(req.user!);
      sendSuccess(res, 'Employee performance retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  getEmployeeLeadStream: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await dashboardService.getEmployeeLeadStream(req.user!, req.params.employeeId);
      sendSuccess(res, 'Employee lead stream retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  getLeadFollowUpJourney: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await dashboardService.getLeadFollowUpJourney(req.user!, req.params.leadId);
      sendSuccess(res, 'Lead follow-up journey retrieved', data);
    } catch (error) {
      next(error);
    }
  },
};
