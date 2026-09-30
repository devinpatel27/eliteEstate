import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateLeadAssignmentSchema } from './settings.validator';
import { PERMISSIONS } from '../../constants/permissions';

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);

settingsRoutes.get(
  '/lead-assignment',
  authorize(PERMISSIONS.SETTINGS_MANAGE),
  settingsController.getLeadAssignment
);

settingsRoutes.put(
  '/lead-assignment',
  authorize(PERMISSIONS.SETTINGS_MANAGE),
  validate(updateLeadAssignmentSchema),
  settingsController.updateLeadAssignment
);
