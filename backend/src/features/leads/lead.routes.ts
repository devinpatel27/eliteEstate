import { Router } from 'express';
import { leadController } from './lead.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, authorizeOneOf } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  createLeadSchema,
  updateLeadSchema,
  listLeadsSchema,
  checkMobileSchema,
  updateStatusSchema,
  bulkUpdateStatusSchema,
  transferLeadSchema,
  createFollowUpSchema,
  addNoteSchema,
  idParamSchema,
} from './lead.validator';
import { PERMISSIONS } from '../../constants/permissions';

export const leadRoutes = Router();

leadRoutes.use(authenticate);

leadRoutes.get(
  '/check-mobile',
  authorize(PERMISSIONS.LEAD_CREATE),
  validate(checkMobileSchema),
  leadController.checkMobile
);

leadRoutes.get(
  '/',
  authorizeOneOf(PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED),
  validate(listLeadsSchema),
  leadController.list
);

leadRoutes.post(
  '/bulk-status',
  authorizeOneOf(PERMISSIONS.LEAD_STATUS_UPDATE, PERMISSIONS.LEAD_READ),
  validate(bulkUpdateStatusSchema),
  leadController.bulkUpdateStatus
);

leadRoutes.get(
  '/:id',
  authorizeOneOf(PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED),
  validate(idParamSchema),
  leadController.getById
);

leadRoutes.post(
  '/',
  authorize(PERMISSIONS.LEAD_CREATE),
  validate(createLeadSchema),
  leadController.create
);

leadRoutes.put(
  '/:id',
  authorize(PERMISSIONS.LEAD_UPDATE),
  validate(updateLeadSchema),
  leadController.update
);

leadRoutes.delete(
  '/:id',
  authorize(PERMISSIONS.LEAD_DELETE),
  validate(idParamSchema),
  leadController.delete
);

leadRoutes.patch(
  '/:id/status',
  authorizeOneOf(PERMISSIONS.LEAD_STATUS_UPDATE, PERMISSIONS.LEAD_READ),
  validate(updateStatusSchema),
  leadController.updateStatus
);

leadRoutes.post(
  '/:id/transfer',
  authorize(PERMISSIONS.LEAD_TRANSFER),
  validate(transferLeadSchema),
  leadController.transfer
);

leadRoutes.get(
  '/:id/follow-ups',
  authorizeOneOf(PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED),
  validate(idParamSchema),
  leadController.getFollowUps
);

leadRoutes.post(
  '/:id/follow-ups',
  authorize(PERMISSIONS.LEAD_FOLLOWUP_CREATE),
  validate(createFollowUpSchema),
  leadController.createFollowUp
);

leadRoutes.get(
  '/:id/activities',
  authorizeOneOf(PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED),
  validate(idParamSchema),
  leadController.getActivities
);

leadRoutes.get(
  '/:id/assignments',
  authorizeOneOf(PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED),
  validate(idParamSchema),
  leadController.getAssignments
);

leadRoutes.post(
  '/:id/notes',
  authorize(PERMISSIONS.LEAD_NOTE_CREATE),
  validate(addNoteSchema),
  leadController.addNote
);
