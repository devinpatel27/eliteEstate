import { Router } from 'express';
import { roleController } from './role.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createRoleSchema, updateRoleSchema } from './role.validator';

export const roleRoutes = Router();

roleRoutes.use(authenticate);

roleRoutes.get('/', authorize('role:read'), roleController.getAll);
roleRoutes.get('/:id', authorize('role:read'), roleController.getById);
roleRoutes.post('/', authorize('role:create'), validate(createRoleSchema), roleController.create);
roleRoutes.put('/:id', authorize('role:update'), validate(updateRoleSchema), roleController.update);
roleRoutes.delete('/:id', authorize('role:delete'), roleController.delete);
