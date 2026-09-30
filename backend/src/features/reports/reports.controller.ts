import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response.utils';
import { reportsService } from './reports.service';
import { reportsExportService } from './reports.export';
import { parseReportFilters } from './reports.filters';
import { ExportFormat, ReportType } from './reports.types';

export const reportsController = {
  getOverview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getOverview(req.user!, req.query as Record<string, unknown>);
      sendSuccess(res, 'Overview report retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  getLeads: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getLeads(req.user!, req.query as Record<string, unknown>);
      sendSuccess(res, 'Lead report retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  getEmployees: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getEmployees(req.user!, req.query as Record<string, unknown>);
      sendSuccess(res, 'Employee performance report retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  getProperties: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getProperties(req.user!, req.query as Record<string, unknown>);
      sendSuccess(res, 'Property report retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  getVisits: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getVisits(req.user!, req.query as Record<string, unknown>);
      sendSuccess(res, 'Visit report retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  exportReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = req.query.report as ReportType;
      const format = req.query.format as ExportFormat;
      const filters = parseReportFilters(req.query as Record<string, unknown>);

      await reportsExportService.export(req.user!, report, format, filters, res);
    } catch (error) {
      next(error);
    }
  },
};
