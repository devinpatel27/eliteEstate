import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, authorizeOneOf } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import { PERMISSIONS } from '../../constants/permissions';
import { reportExportSchema, reportFiltersSchema } from './reports.validator';

export const reportRoutes = Router();

reportRoutes.use(authenticate);

reportRoutes.get(
  '/overview',
  authorize(PERMISSIONS.REPORT_READ),
  validate(reportFiltersSchema),
  reportsController.getOverview
);

reportRoutes.get(
  '/leads',
  authorize(PERMISSIONS.REPORT_READ),
  validate(reportFiltersSchema),
  reportsController.getLeads
);

reportRoutes.get(
  '/employees',
  authorize(PERMISSIONS.REPORT_READ),
  validate(reportFiltersSchema),
  reportsController.getEmployees
);

reportRoutes.get(
  '/properties',
  authorize(PERMISSIONS.REPORT_READ),
  validate(reportFiltersSchema),
  reportsController.getProperties
);

reportRoutes.get(
  '/visits',
  authorize(PERMISSIONS.REPORT_READ),
  validate(reportFiltersSchema),
  reportsController.getVisits
);

reportRoutes.get(
  '/export',
  authorizeOneOf(PERMISSIONS.REPORT_EXPORT, PERMISSIONS.WILDCARD),
  validate(reportExportSchema),
  reportsController.exportReport
);
