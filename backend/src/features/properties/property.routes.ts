import { Router } from 'express';
import { propertyController } from './property.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadPropertyMedia } from '../../middleware/upload.middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  listPropertiesSchema,
  idParamSchema,
  mediaParamSchema,
} from './property.validator';
import { PERMISSIONS } from '../../constants/permissions';

export const propertyRoutes = Router();

propertyRoutes.use(authenticate);

propertyRoutes.get(
  '/dashboard',
  authorize(PERMISSIONS.PROPERTY_READ),
  propertyController.dashboard
);

propertyRoutes.get(
  '/',
  authorize(PERMISSIONS.PROPERTY_READ),
  validate(listPropertiesSchema),
  propertyController.list
);

propertyRoutes.get(
  '/:id',
  authorize(PERMISSIONS.PROPERTY_READ),
  validate(idParamSchema),
  propertyController.getById
);

propertyRoutes.post(
  '/',
  authorize(PERMISSIONS.PROPERTY_CREATE),
  validate(createPropertySchema),
  propertyController.create
);

propertyRoutes.put(
  '/:id',
  authorize(PERMISSIONS.PROPERTY_UPDATE),
  validate(updatePropertySchema),
  propertyController.update
);

propertyRoutes.delete(
  '/:id',
  authorize(PERMISSIONS.PROPERTY_DELETE),
  validate(idParamSchema),
  propertyController.delete
);

propertyRoutes.patch(
  '/:id/publish',
  authorize(PERMISSIONS.PROPERTY_PUBLISH),
  validate(idParamSchema),
  propertyController.togglePublish
);

propertyRoutes.patch(
  '/:id/feature',
  authorize(PERMISSIONS.PROPERTY_PUBLISH),
  validate(idParamSchema),
  propertyController.toggleFeature
);

propertyRoutes.post(
  '/:id/media',
  authorize(PERMISSIONS.PROPERTY_UPDATE),
  validate(idParamSchema),
  uploadPropertyMedia,
  propertyController.uploadMedia
);

propertyRoutes.delete(
  '/:id/media/:mediaId',
  authorize(PERMISSIONS.PROPERTY_UPDATE),
  validate(mediaParamSchema),
  propertyController.deleteMedia
);

propertyRoutes.get(
  '/:id/inquiries',
  authorize(PERMISSIONS.PROPERTY_READ),
  validate(idParamSchema),
  propertyController.getInquiries
);
