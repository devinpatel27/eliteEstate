import { Types } from 'mongoose';
import { visitRepository } from './visit.repository';
import {
  canReadAllVisits,
  canAccessVisitForLead,
  hasVisitPermission,
  requiresAssignedVisitScope,
} from './visit.access';
import { leadRepository } from '../leads/lead.repository';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activityLogger';
import { JwtPayload } from '../../types/api.types';
import { PERMISSIONS } from '../../constants/permissions';
import {
  CreateVisitInput,
  UpdateVisitInput,
  AddVisitHistoryInput,
} from './visit.validator';
import { FOLLOW_UP_VISIT_TYPES } from '../../constants/visit.constants';
import type { VisitStatus, VisitType } from '../../constants/visit.constants';
import { CLOSED_LEAD_STATUSES, type FollowUpType } from '../../constants/lead.constants';

const assertCanAccessVisit = async (user: JwtPayload, visitId: string) => {
  const visit = await visitRepository.findById(visitId);
  if (!visit || !visit.lead) throw new AppError('Visit not found', 404);
  if (!canAccessVisitForLead(user, visit.lead as never)) {
    throw new AppError('You do not have access to this visit', 403);
  }
  return visit;
};

export const visitService = {
  list: async (user: JwtPayload, options: Parameters<typeof visitRepository.findAll>[0]) => {
    const canReadAssigned = hasVisitPermission(user.permissions, PERMISSIONS.VISIT_READ_ASSIGNED);
    if (requiresAssignedVisitScope(user.permissions) && !canReadAssigned) {
      throw new AppError('Insufficient permissions', 403);
    }
    if (requiresAssignedVisitScope(user.permissions)) {
      options.assignedOnly = true;
      options.assignedToUserId = user.userId;
    }
    options.userId = user.userId;
    return visitRepository.findAll(options);
  },

  getById: async (id: string, user: JwtPayload) => {
    const visit = await visitRepository.findById(id, user.userId);
    if (!visit || !visit.lead) throw new AppError('Visit not found', 404);
    if (!canAccessVisitForLead(user, visit.lead as never)) {
      throw new AppError('You do not have access to this visit', 403);
    }
    const history = await visitRepository.getHistory(id);
    return { ...visit, history };
  },

  create: async (data: CreateVisitInput, user: JwtPayload, ipAddress?: string) => {
    if (!hasVisitPermission(user.permissions, PERMISSIONS.VISIT_CREATE)) {
      throw new AppError('Insufficient permissions', 403);
    }

    const lead = await leadRepository.findById(data.leadId);
    if (!lead) throw new AppError('Lead not found', 404);
    if (!canAccessVisitForLead(user, lead)) {
      throw new AppError('You do not have access to create a visit for this lead', 403);
    }
    if ((CLOSED_LEAD_STATUSES as readonly string[]).includes(lead.status) && !canReadAllVisits(user.permissions)) {
      throw new AppError('This lead is closed/booked. Only an admin can schedule visits for it.', 403);
    }

    const visit = await visitRepository.create({
      leadId: lead._id,
      assignmentId: lead.currentAssignmentId,
      type: data.type as VisitType,
      scheduledDate: new Date(data.scheduledDate),
      scheduledTime: data.scheduledTime,
      status: (data.status as VisitStatus) || 'scheduled',
      remark: data.remark,
      source: 'manual',
      createdBy: new Types.ObjectId(user.userId),
    });

    await visitRepository.addHistory({
      visitId: visit._id,
      action: 'scheduled',
      remark: data.remark || 'Visit scheduled manually',
      performedBy: new Types.ObjectId(user.userId),
    });

    await logActivity({
      userId: user.userId,
      action: 'CREATE_VISIT',
      module: 'VISIT',
      description: `Created visit for lead ${lead.leadId}`,
      ipAddress,
    });

    return visitRepository.findById(visit._id.toString());
  },

  update: async (id: string, data: UpdateVisitInput, user: JwtPayload, ipAddress?: string) => {
    if (!hasVisitPermission(user.permissions, PERMISSIONS.VISIT_UPDATE)) {
      throw new AppError('Insufficient permissions', 403);
    }

    const existing = await assertCanAccessVisit(user, id);
    const updateData: Record<string, unknown> = {};
    if (data.type) updateData.type = data.type;
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.scheduledTime !== undefined) updateData.scheduledTime = data.scheduledTime;
    if (data.remark !== undefined) updateData.remark = data.remark;
    if (data.status) updateData.status = data.status;

    const updated = await visitRepository.update(id, updateData);
    if (!updated) throw new AppError('Visit not found', 404);

    if (data.status && data.status !== existing.status) {
      await visitRepository.addHistory({
        visitId: new Types.ObjectId(id),
        action: 'status_changed',
        remark: `Status changed to ${data.status}`,
        performedBy: new Types.ObjectId(user.userId),
        metadata: { from: existing.status, to: data.status },
      });
    }

    await logActivity({
      userId: user.userId,
      action: 'UPDATE_VISIT',
      module: 'VISIT',
      description: `Updated visit ${id}`,
      ipAddress,
    });

    return visitRepository.findById(id);
  },

  toggleFavorite: async (id: string, user: JwtPayload) => {
    if (!hasVisitPermission(user.permissions, PERMISSIONS.VISIT_FAVORITE)) {
      throw new AppError('Insufficient permissions', 403);
    }

    const visit = await assertCanAccessVisit(user, id);
    const isFavorite = await visitRepository.toggleFavorite(id, user.userId);
    await visitRepository.addHistory({
      visitId: new Types.ObjectId(id),
      action: 'note',
      remark: isFavorite ? 'Marked as favorite' : 'Removed from favorites',
      performedBy: new Types.ObjectId(user.userId),
    });
    await logActivity({
      userId: user.userId,
      action: 'TOGGLE_VISIT_FAVORITE',
      module: 'VISIT',
      description: `${isFavorite ? 'Favorited' : 'Unfavorited'} visit ${id} for lead ${(visit.lead as { leadId?: string })?.leadId || ''}`,
    });
    return visitRepository.findById(id, user.userId);
  },

  addHistory: async (id: string, data: AddVisitHistoryInput, user: JwtPayload) => {
    const visit = await assertCanAccessVisit(user, id);
    await visitRepository.addHistory({
      visitId: new Types.ObjectId(id),
      action: data.action as import('../../constants/visit.constants').VisitHistoryAction,
      remark: data.remark,
      performedBy: new Types.ObjectId(user.userId),
    });
    await logActivity({
      userId: user.userId,
      action: 'ADD_VISIT_HISTORY',
      module: 'VISIT',
      description: `Added visit log for lead ${(visit.lead as { leadId?: string })?.leadId || id}`,
    });
    return visitRepository.getHistory(id);
  },

  createFromFollowUp: async (params: {
    leadId: Types.ObjectId;
    assignmentId?: Types.ObjectId;
    followUpId: Types.ObjectId;
    type: FollowUpType;
    scheduledDate: Date;
    scheduledTime?: string;
    remark?: string;
    userId: string;
  }) => {
    if (!FOLLOW_UP_VISIT_TYPES.includes(params.type)) return null;

    const visit = await visitRepository.create({
      leadId: params.leadId,
      assignmentId: params.assignmentId,
      followUpId: params.followUpId,
      type: params.type as VisitType,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      status: 'scheduled',
      remark: params.remark,
      source: 'follow_up',
      createdBy: new Types.ObjectId(params.userId),
    });

    await visitRepository.addHistory({
      visitId: visit._id,
      action: 'scheduled',
      remark: params.remark || 'Created from lead follow-up',
      performedBy: new Types.ObjectId(params.userId),
      metadata: { followUpId: params.followUpId.toString(), source: 'follow_up' },
    });

    await logActivity({
      userId: params.userId,
      action: 'CREATE_VISIT_FROM_FOLLOWUP',
      module: 'VISIT',
      description: `Created ${params.type} visit from lead follow-up`,
    });

    return visit;
  },
};
