import { Router } from 'express';
import { propertyTypeController, leadSourceController, followUpActivityController } from './master.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, authorizeOneOf } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  createFollowUpActivitySchema,
  createMasterSchema,
  idParamSchema,
  updateFollowUpActivitySchema,
  updateMasterSchema,
} from './master.validator';
import { PERMISSIONS } from '../../constants/permissions';

export const propertyTypeRoutes = Router();
export const leadSourceRoutes = Router();
export const followUpActivityRoutes = Router();

const readAuth = [authenticate, authorizeOneOf(PERMISSIONS.LEAD_MASTER_MANAGE, PERMISSIONS.LEAD_CREATE, PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED)];
const manageAuth = [authenticate, authorize(PERMISSIONS.LEAD_MASTER_MANAGE)];

propertyTypeRoutes.get('/', ...readAuth, propertyTypeController.list);
propertyTypeRoutes.get('/:id', ...readAuth, validate(idParamSchema), propertyTypeController.getById);
propertyTypeRoutes.post('/', ...manageAuth, validate(createMasterSchema), propertyTypeController.create);
propertyTypeRoutes.put('/:id', ...manageAuth, validate(updateMasterSchema), propertyTypeController.update);
propertyTypeRoutes.delete('/:id', ...manageAuth, validate(idParamSchema), propertyTypeController.delete);

leadSourceRoutes.get('/', ...readAuth, leadSourceController.list);
leadSourceRoutes.get('/:id', ...readAuth, validate(idParamSchema), leadSourceController.getById);
leadSourceRoutes.post('/', ...manageAuth, validate(createMasterSchema), leadSourceController.create);
leadSourceRoutes.put('/:id', ...manageAuth, validate(updateMasterSchema), leadSourceController.update);
leadSourceRoutes.delete('/:id', ...manageAuth, validate(idParamSchema), leadSourceController.delete);

followUpActivityRoutes.get('/', ...readAuth, followUpActivityController.list);
followUpActivityRoutes.get('/:id', ...readAuth, validate(idParamSchema), followUpActivityController.getById);
followUpActivityRoutes.post('/', ...manageAuth, validate(createFollowUpActivitySchema), followUpActivityController.create);
followUpActivityRoutes.put('/:id', ...manageAuth, validate(updateFollowUpActivitySchema), followUpActivityController.update);
followUpActivityRoutes.delete('/:id', ...manageAuth, validate(idParamSchema), followUpActivityController.delete);
