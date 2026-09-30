import { Router } from 'express';
import { amenityController } from './amenity.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, authorizeOneOf } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createMasterSchema, updateMasterSchema, idParamSchema } from '../masters/master.validator';
import { PERMISSIONS } from '../../constants/permissions';

export const amenityRoutes = Router();

const readAuth = [
  authenticate,
  authorizeOneOf(
    PERMISSIONS.PROPERTY_MASTER_MANAGE,
    PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_CREATE
  ),
];
const manageAuth = [authenticate, authorize(PERMISSIONS.PROPERTY_MASTER_MANAGE)];

amenityRoutes.get('/', ...readAuth, amenityController.list);
amenityRoutes.get('/:id', ...readAuth, validate(idParamSchema), amenityController.getById);
amenityRoutes.post('/', ...manageAuth, validate(createMasterSchema), amenityController.create);
amenityRoutes.put('/:id', ...manageAuth, validate(updateMasterSchema), amenityController.update);
amenityRoutes.delete('/:id', ...manageAuth, validate(idParamSchema), amenityController.delete);
