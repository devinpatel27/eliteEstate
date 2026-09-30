import { Router } from 'express';
import { visitController } from './visit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, authorizeOneOf } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  listVisitsSchema,
  createVisitSchema,
  updateVisitSchema,
  addVisitHistorySchema,
  idParamSchema,
} from './visit.validator';
import { PERMISSIONS } from '../../constants/permissions';

export const visitRoutes = Router();

visitRoutes.use(authenticate);

visitRoutes.get(
  '/',
  authorizeOneOf(PERMISSIONS.VISIT_READ, PERMISSIONS.VISIT_READ_ASSIGNED),
  validate(listVisitsSchema),
  visitController.list
);

visitRoutes.get(
  '/:id',
  authorizeOneOf(PERMISSIONS.VISIT_READ, PERMISSIONS.VISIT_READ_ASSIGNED),
  validate(idParamSchema),
  visitController.getById
);

visitRoutes.post(
  '/',
  authorize(PERMISSIONS.VISIT_CREATE),
  validate(createVisitSchema),
  visitController.create
);

visitRoutes.patch(
  '/:id',
  authorize(PERMISSIONS.VISIT_UPDATE),
  validate(updateVisitSchema),
  visitController.update
);

visitRoutes.patch(
  '/:id/favorite',
  authorize(PERMISSIONS.VISIT_FAVORITE),
  validate(idParamSchema),
  visitController.toggleFavorite
);

visitRoutes.post(
  '/:id/history',
  authorizeOneOf(PERMISSIONS.VISIT_READ, PERMISSIONS.VISIT_READ_ASSIGNED),
  validate(addVisitHistorySchema),
  visitController.addHistory
);
