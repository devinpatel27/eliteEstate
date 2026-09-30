import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadProfileImage } from '../../middleware/upload.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateStatusSchema,
  resetPasswordSchema,
  listEmployeesSchema,
} from './employee.validator';

export const employeeRoutes = Router();

employeeRoutes.use(authenticate);

employeeRoutes.get(
  '/',
  authorize('employee:read'),
  validate(listEmployeesSchema),
  employeeController.list
);
employeeRoutes.get('/:id', authorize('employee:read'), employeeController.getById);
employeeRoutes.post(
  '/',
  authorize('employee:create'),
  uploadProfileImage,
  validate(createEmployeeSchema),
  employeeController.create
);
employeeRoutes.put(
  '/:id',
  authorize('employee:update'),
  uploadProfileImage,
  validate(updateEmployeeSchema),
  employeeController.update
);
employeeRoutes.delete('/:id', authorize('employee:delete'), employeeController.delete);
employeeRoutes.patch(
  '/:id/status',
  authorize('employee:manage'),
  validate(updateStatusSchema),
  employeeController.updateStatus
);
employeeRoutes.patch(
  '/:id/reset-password',
  authorize('employee:manage'),
  validate(resetPasswordSchema),
  employeeController.resetPassword
);
