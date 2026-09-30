import { FilterQuery, Types } from 'mongoose';
import { leadRepository } from './lead.repository';
import {
  getLeadAccessScope,
  isLeadAdmin,
  hasLeadPermission,
  canManageLead,
  canReadAllLeads,
  requiresAssignedOnlyScope,
} from './lead.access';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activityLogger';
import { generateLeadId } from '../../utils/leadId.utils';
import { normalizeMobile, isValidMobile } from '../../utils/mobile.utils';
import { isValidObjectId, resolveRefId, toObjectId } from '../../utils/objectId.utils';
import { JwtPayload } from '../../types/api.types';
import { VisitModel } from '../../models/Visit.model';
import { LeadModel } from '../../models/Lead.model';
import {
  ACTIVE_LEAD_STATUSES,
  CLOSED_LEAD_STATUSES,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  LeadStatus,
  LeadCategory,
  LeadPriority,
} from '../../constants/lead.constants';
import { PERMISSIONS } from '../../constants/permissions';
import {
  CreateLeadInput,
  UpdateLeadInput,
  UpdateStatusInput,
  BulkUpdateStatusInput,
  TransferLeadInput,
  CreateFollowUpInput,
  AddNoteInput,
} from './lead.validator';
import { ILead } from '../../models/Lead.model';
import { LeadFollowUpModel } from '../../models/LeadFollowUp.model';
import { FollowUpActivityModel } from '../../models/FollowUpActivity.model';
import { visitService } from '../visits/visit.service';
import { FOLLOW_UP_VISIT_TYPES } from '../../constants/visit.constants';
import { sendLeadThankYouEmail } from '../../utils/email.utils';

const assertCanView = (user: JwtPayload, lead: ILead) => {
  const scope = getLeadAccessScope(user, lead);
  if (!scope.canView) throw new AppError('You do not have access to this lead', 403);
  return scope;
};

export const leadService = {
  list: async (user: JwtPayload, options: Parameters<typeof leadRepository.findAll>[0]) => {
    const canReadAssigned = hasLeadPermission(user.permissions, PERMISSIONS.LEAD_READ_ASSIGNED);

    if (requiresAssignedOnlyScope(user.permissions) && !canReadAssigned) {
      throw new AppError('Insufficient permissions', 403);
    }

    if (requiresAssignedOnlyScope(user.permissions)) {
      options.assignedOnly = true;
      options.assignedToUserId = user.userId;
      options.assignedTo = undefined;
    }

    return leadRepository.findAll(options);
  },

  checkMobile: async (mobile: string) => {
    if (!isValidMobile(mobile)) {
      throw new AppError('Invalid mobile number', 400);
    }

    const normalized = normalizeMobile(mobile);
    const leads = await leadRepository.findByMobile(normalized);
    const activeLead = leads.find((l) => (ACTIVE_LEAD_STATUSES as readonly string[]).includes(l.status as string));
    const closedLeads = leads.filter((l) =>
      (CLOSED_LEAD_STATUSES as readonly string[]).includes(l.status as string)
    );

    return {
      exists: leads.length > 0,
      activeLead: activeLead || null,
      closedLeads,
      normalizedMobile: normalized,
    };
  },

  getById: async (id: string, user: JwtPayload) => {
    if (!isValidObjectId(id)) throw new AppError('Invalid lead ID', 400);
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);
    assertCanView(user, lead);
    return lead;
  },

  create: async (data: CreateLeadInput, userId: string, ipAddress?: string) => {
    if (!isValidMobile(data.mobile)) {
      throw new AppError('Invalid mobile number', 400);
    }

    const normalized = normalizeMobile(data.mobile);
    const activeLead = await leadRepository.findActiveByMobile(normalized);

    if (activeLead) {
      throw new AppError('Lead already exists.', 409, {
        existingLeadId: activeLead._id,
        existingLead: activeLead,
      });
    }

    const leadId = await generateLeadId();
    const now = new Date();

    const lead = await leadRepository.create({
      leadId,
      customerName: data.customerName,
      mobile: normalized,
      alternateMobile: data.alternateMobile ? normalizeMobile(data.alternateMobile) : undefined,
      email: data.email?.toLowerCase(),
      city: data.city,
      address: data.address,
      category: data.category as LeadCategory,
      propertyType: new Types.ObjectId(data.propertyType),
      propertyConfiguration: data.propertyConfiguration,
      leadSource: new Types.ObjectId(data.leadSource),
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      preferredArea: data.preferredArea,
      priority: data.priority as LeadPriority,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
      status: 'open',
      initialRemark: data.initialRemark,
      createdBy: new Types.ObjectId(userId),
    });

    let assignment = null;
    if (data.assignedTo) {
      const sequence = await leadRepository.getNextAssignmentSequence(lead._id.toString());
      assignment = await leadRepository.createAssignment({
        leadId: lead._id,
        assignedTo: new Types.ObjectId(data.assignedTo),
        assignedBy: new Types.ObjectId(userId),
        sequence,
      });

      await leadRepository.update(lead._id.toString(), {
        assignedTo: new Types.ObjectId(data.assignedTo),
        currentAssignmentId: assignment._id,
        assignedAt: now,
      });

      await leadRepository.createActivity({
        leadId: lead._id,
        assignmentId: assignment._id,
        type: 'LEAD_ASSIGNED',
        title: 'Lead Assigned',
        remark: `Assigned during lead creation`,
        performedBy: new Types.ObjectId(userId),
      });
    }

    await leadRepository.createActivity({
      leadId: lead._id,
      assignmentId: assignment?._id,
      type: 'LEAD_CREATED',
      title: 'Lead Created',
      remark: data.initialRemark,
      performedBy: new Types.ObjectId(userId),
    });

    await logActivity({
      userId,
      action: 'CREATE_LEAD',
      module: 'LEAD',
      description: `Created lead ${leadId} for ${data.customerName}`,
      ipAddress,
    });

    return leadRepository.findById(lead._id.toString());
  },

  update: async (
    id: string,
    data: UpdateLeadInput,
    user: JwtPayload | string,
    ipAddress?: string
  ) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    const userId = typeof user === 'string' ? user : user.userId;
    const permissions = typeof user === 'string' ? [] : user.permissions;

    if ((CLOSED_LEAD_STATUSES as readonly string[]).includes(lead.status) && !isLeadAdmin(permissions)) {
      throw new AppError('This lead is closed/booked. Only an admin can edit or reopen it.', 403);
    }

    if (data.mobile && !isValidMobile(data.mobile)) {
      throw new AppError('Invalid mobile number', 400);
    }

    if (data.mobile) {
      const normalized = normalizeMobile(data.mobile);
      const activeLead = await leadRepository.findActiveByMobile(normalized);
      if (activeLead && activeLead._id.toString() !== id) {
        throw new AppError('Lead already exists.', 409, { existingLeadId: activeLead._id });
      }
      data.mobile = normalized;
    }

    const updateData: Partial<ILead> = {
      ...data,
      updatedBy: new Types.ObjectId(userId),
    } as unknown as Partial<ILead>;

    if (data.propertyType) updateData.propertyType = new Types.ObjectId(data.propertyType);
    if (data.leadSource) updateData.leadSource = new Types.ObjectId(data.leadSource);
    if (data.alternateMobile) updateData.alternateMobile = normalizeMobile(data.alternateMobile);

    const updated = await leadRepository.update(id, updateData);

    await logActivity({
      userId,
      action: 'UPDATE_LEAD',
      module: 'LEAD',
      description: `Updated lead ${lead.leadId}`,
      ipAddress,
    });

    return updated;
  },

  delete: async (id: string, user: JwtPayload | string, ipAddress?: string) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    const userId = typeof user === 'string' ? user : user.userId;
    await leadRepository.softDelete(id);

    await logActivity({
      userId,
      action: 'DELETE_LEAD',
      module: 'LEAD',
      description: `Deleted lead ${lead.leadId}`,
      ipAddress,
    });
  },

  updateStatus: async (
    id: string,
    data: UpdateStatusInput,
    user: JwtPayload,
    ipAddress?: string
  ) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    if (!canManageLead(user, lead)) {
      throw new AppError('You do not have permission to update this lead status', 403);
    }

    const currentStatus = lead.status as LeadStatus;
    const newStatus = data.status as LeadStatus;

    if (currentStatus === newStatus) {
      return lead;
    }

    const admin = isLeadAdmin(user.permissions);

    // If current status is closed or booked, ONLY admin can reopen or change its status!
    if ((CLOSED_LEAD_STATUSES as readonly string[]).includes(currentStatus) && !admin) {
      throw new AppError('This lead is closed/booked. Only an admin can reopen or change its status.', 403);
    }

    const allowed = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus) && !admin) {
      throw new AppError(
        `Cannot transition from ${STATUS_LABELS[currentStatus] || currentStatus} to ${STATUS_LABELS[newStatus] || newStatus}`,
        400
      );
    }

    const updated = await leadRepository.update(id, {
      status: newStatus,
      updatedBy: new Types.ObjectId(user.userId),
    });

    // If status became closed/booked, clear next follow-up date
    if ((CLOSED_LEAD_STATUSES as readonly string[]).includes(newStatus)) {
      await leadRepository.syncNextFollowUpDate(id, new Types.ObjectId(user.userId), undefined);
    }

    const activityType =
      (CLOSED_LEAD_STATUSES as readonly string[]).includes(newStatus) ? 'LEAD_CLOSED' : 'STATUS_CHANGED';

    await leadRepository.createActivity({
      leadId: lead._id,
      assignmentId: lead.currentAssignmentId,
      type: activityType,
      title: `Status changed to ${STATUS_LABELS[newStatus] || newStatus}`,
      remark: data.remark,
      performedBy: new Types.ObjectId(user.userId),
      metadata: { from: currentStatus, to: newStatus },
    });

    await logActivity({
      userId: user.userId,
      action: 'UPDATE_LEAD_STATUS',
      module: 'LEAD',
      description: `Lead ${lead.leadId} status: ${currentStatus} → ${newStatus}`,
      ipAddress,
    });

    return updated;
  },

  bulkUpdateStatus: async (
    data: BulkUpdateStatusInput,
    user: JwtPayload,
    ipAddress?: string
  ) => {
    const admin = isLeadAdmin(user.permissions);
    const validObjectIds = data.leadIds.filter(isValidObjectId).map((id) => new Types.ObjectId(id));
    if (validObjectIds.length === 0) {
      throw new AppError('No valid lead IDs provided', 400);
    }

    const query: FilterQuery<ILead> = {
      _id: { $in: validObjectIds },
      deletedAt: null,
    };

    if (!admin) {
      query.assignedTo = new Types.ObjectId(user.userId);
      query.status = { $nin: ['closed', 'booked', 'closed_won', 'closed_lost'] };
    }

    const updateFields: Record<string, unknown> = {
      status: data.status,
      updatedBy: new Types.ObjectId(user.userId),
    };

    const isClosedOrBooked = (CLOSED_LEAD_STATUSES as readonly string[]).includes(data.status);
    const updateOps: Record<string, unknown> = { $set: updateFields };
    if (isClosedOrBooked) {
      updateOps.$unset = { nextFollowUpDate: 1 };
    }

    const result = await LeadModel.updateMany(query, updateOps);

    if (isClosedOrBooked) {
      await VisitModel.updateMany(
        { leadId: { $in: validObjectIds }, status: 'scheduled' },
        { $set: { status: 'cancelled' } }
      );
    }

    await logActivity({
      userId: user.userId,
      action: 'BULK_UPDATE_LEAD_STATUS',
      module: 'LEAD',
      description: `Bulk updated ${result.modifiedCount} leads to status: ${data.status}`,
      ipAddress,
    });

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      status: data.status,
    };
  },

  transfer: async (
    id: string,
    data: TransferLeadInput,
    user: JwtPayload | string,
    ipAddress?: string
  ) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    const userId = typeof user === 'string' ? user : user.userId;
    const permissions = typeof user === 'string' ? [] : user.permissions;

    if ((CLOSED_LEAD_STATUSES as readonly string[]).includes(lead.status) && !isLeadAdmin(permissions)) {
      throw new AppError('This lead is closed/booked. Only an admin can transfer or reopen it.', 403);
    }

    if (resolveRefId(lead.assignedTo) === data.assignedTo) {
      throw new AppError('Lead is already assigned to this employee', 400);
    }

    await leadRepository.closeCurrentAssignment(id, data.transferRemark);

    const sequence = await leadRepository.getNextAssignmentSequence(id);
    const assignment = await leadRepository.createAssignment({
      leadId: lead._id,
      assignedTo: new Types.ObjectId(data.assignedTo),
      assignedBy: new Types.ObjectId(userId),
      sequence,
      transferRemark: data.transferRemark,
    });

    const now = new Date();
    await leadRepository.update(id, {
      assignedTo: new Types.ObjectId(data.assignedTo),
      currentAssignmentId: assignment._id,
      assignedAt: now,
      updatedBy: new Types.ObjectId(userId),
    });
    // Clear schedule NFD on transfer — new assignee starts without a prior due date
    await leadRepository.syncNextFollowUpDate(id, new Types.ObjectId(userId));

    await leadRepository.createActivity({
      leadId: lead._id,
      assignmentId: assignment._id,
      type: 'LEAD_TRANSFERRED',
      title: 'Lead Transferred',
      remark: data.transferRemark,
      performedBy: new Types.ObjectId(userId),
    });

    await logActivity({
      userId,
      action: 'TRANSFER_LEAD',
      module: 'LEAD',
      description: `Transferred lead ${lead.leadId}`,
      ipAddress,
    });

    return leadRepository.findById(id);
  },

  getFollowUps: async (id: string, user: JwtPayload) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);
    const scope = assertCanView(user, lead);

    if (!scope.isAdmin && !scope.filterAssignmentId) {
      return [];
    }

    const assignmentId = scope.isAdmin ? undefined : scope.filterAssignmentId;
    return leadRepository.getFollowUps(id, assignmentId, { strict: !scope.isAdmin });
  },

  createFollowUp: async (
    id: string,
    data: CreateFollowUpInput,
    user: JwtPayload,
    ipAddress?: string
  ) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    if (!canManageLead(user, lead)) {
      throw new AppError('You do not have permission to add follow-ups', 403);
    }

    if ((CLOSED_LEAD_STATUSES as readonly string[]).includes(lead.status) && !isLeadAdmin(user.permissions)) {
      throw new AppError('This lead is closed/booked. Only an admin can add follow-ups or reopen it.', 403);
    }

    if (!lead.currentAssignmentId) {
      const sequence = await leadRepository.getNextAssignmentSequence(id);
      const assignment = await leadRepository.createAssignment({
        leadId: lead._id,
        assignedTo: new Types.ObjectId(user.userId),
        assignedBy: new Types.ObjectId(user.userId),
        sequence,
      });

      const now = new Date();
      await leadRepository.update(id, {
        assignedTo: new Types.ObjectId(user.userId),
        currentAssignmentId: assignment._id,
        assignedAt: now,
        updatedBy: new Types.ObjectId(user.userId),
      });

      lead.currentAssignmentId = assignment._id;

      await leadRepository.createActivity({
        leadId: lead._id,
        assignmentId: assignment._id,
        type: 'LEAD_ASSIGNED',
        title: 'Lead Assigned',
        remark: 'Auto-assigned when adding follow-up',
        performedBy: new Types.ObjectId(user.userId),
      });
    }

    const priorFollowUpCount = await LeadFollowUpModel.countDocuments({ leadId: lead._id });
    const parentActivityId = data.parentActivity && toObjectId(data.parentActivity);
    const childActivityId = data.childActivity && toObjectId(data.childActivity);
    const [parentActivity, childActivity] = await Promise.all([
      parentActivityId ? FollowUpActivityModel.findById(parentActivityId).select('name').lean() : null,
      childActivityId ? FollowUpActivityModel.findById(childActivityId).select('name').lean() : null,
    ]);

    const followUp = await leadRepository.createFollowUp({
      leadId: lead._id,
      assignmentId: lead.currentAssignmentId,
      followUpDate: new Date(data.followUpDate),
      followUpTime: data.followUpTime,
      type: data.type,
      priority: data.priority,
      parentActivity: parentActivityId || undefined,
      childActivity: childActivityId || undefined,
      remark: data.remark,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
      createdBy: new Types.ObjectId(user.userId),
    });

    const newStatus = (data.status as LeadStatus) || (lead.status as LeadStatus);
    const isNewStatusClosed = (CLOSED_LEAD_STATUSES as readonly string[]).includes(newStatus);
    const nextNfd = isNewStatusClosed && !data.nextFollowUpDate ? undefined : (data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined);

    await leadRepository.syncNextFollowUpDate(
      id,
      new Types.ObjectId(user.userId),
      nextNfd
    );

    if (data.priority && lead.priority !== data.priority) {
      await leadRepository.update(id, {
        priority: data.priority as LeadPriority,
        updatedBy: new Types.ObjectId(user.userId),
      });
    }

    if (data.status && lead.status !== data.status) {
      const currentStatus = lead.status as LeadStatus;
      await leadRepository.update(id, {
        status: newStatus,
        updatedBy: new Types.ObjectId(user.userId),
      });

      const statusActivityType = isNewStatusClosed ? 'LEAD_CLOSED' : 'STATUS_CHANGED';
      await leadRepository.createActivity({
        leadId: lead._id,
        assignmentId: lead.currentAssignmentId,
        type: statusActivityType,
        title: `Status changed to ${STATUS_LABELS[newStatus] || newStatus}`,
        remark: data.remark ? `Via follow-up: ${data.remark}` : 'Updated via follow-up',
        performedBy: new Types.ObjectId(user.userId),
        metadata: { from: currentStatus, to: newStatus, followUpId: followUp._id },
      });
    }

    const activityTypeMap: Record<string, string> = {
      call: 'CALL_DONE',
      property_visit: 'VISIT_SCHEDULED',
      revisit: 'REVISIT_COMPLETED',
      negotiation: 'NEGOTIATION_STARTED',
    };

    await leadRepository.createActivity({
      leadId: lead._id,
      assignmentId: lead.currentAssignmentId,
      type: (activityTypeMap[data.type] || 'FOLLOW_UP_ADDED') as 'FOLLOW_UP_ADDED',
      title: `Follow-up: ${(childActivity?.name || parentActivity?.name || data.type).replace(/_/g, ' ')}`,
      remark: data.remark,
      performedBy: new Types.ObjectId(user.userId),
      metadata: {
        followUpId: followUp._id,
        priority: data.priority,
        parentActivity: parentActivity?.name,
        childActivity: childActivity?.name,
      },
    });

    await logActivity({
      userId: user.userId,
      action: 'ADD_LEAD_FOLLOWUP',
      module: 'LEAD',
      description: `Added follow-up for lead ${lead.leadId}`,
      ipAddress,
    });

    if (priorFollowUpCount === 0) {
      await sendLeadThankYouEmail(lead.customerName, lead.email);
    }

    if (FOLLOW_UP_VISIT_TYPES.includes(data.type as never)) {
      await visitService.createFromFollowUp({
        leadId: lead._id,
        assignmentId: lead.currentAssignmentId,
        followUpId: followUp._id,
        type: data.type as never,
        scheduledDate: new Date(data.followUpDate),
        scheduledTime: data.followUpTime,
        remark: data.remark,
        userId: user.userId,
      });
    }

    return followUp;
  },

  getActivities: async (id: string, user: JwtPayload) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);
    const scope = assertCanView(user, lead);

    if (!scope.isAdmin && !scope.filterAssignmentId) {
      return [];
    }

    const assignmentId = scope.isAdmin ? undefined : scope.filterAssignmentId;
    return leadRepository.getActivities(id, assignmentId, { strict: !scope.isAdmin });
  },

  getAssignments: async (id: string, user: JwtPayload) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);
    const scope = assertCanView(user, lead);

    const assignedToUserId = scope.isAdmin ? undefined : user.userId;
    return leadRepository.getAssignments(id, assignedToUserId);
  },

  addNote: async (id: string, data: AddNoteInput, user: JwtPayload, ipAddress?: string) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    if (!canManageLead(user, lead)) {
      throw new AppError('You do not have permission to add notes', 403);
    }

    if ((CLOSED_LEAD_STATUSES as readonly string[]).includes(lead.status) && !isLeadAdmin(user.permissions)) {
      throw new AppError('This lead is closed/booked. Only an admin can add notes to a closed/booked lead.', 403);
    }

    const note = {
      text: data.text,
      createdBy: new Types.ObjectId(user.userId),
      createdAt: new Date(),
    };

    lead.notes.push(note as never);
    lead.updatedBy = new Types.ObjectId(user.userId);
    await lead.save();

    await leadRepository.createActivity({
      leadId: lead._id,
      assignmentId: lead.currentAssignmentId,
      type: 'NOTE_ADDED',
      title: 'Note Added',
      remark: data.text,
      performedBy: new Types.ObjectId(user.userId),
    });

    await logActivity({
      userId: user.userId,
      action: 'ADD_LEAD_NOTE',
      module: 'LEAD',
      description: `Added note to lead ${lead.leadId}`,
      ipAddress,
    });

    return leadRepository.findById(id);
  },

  getLeadStats: async (user: JwtPayload) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const tomorrowStart = new Date(startOfDay);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const baseFilter: Record<string, unknown> = {};
    let visitLeadFilter: Record<string, unknown> = { status: 'scheduled' };

    if (requiresAssignedOnlyScope(user.permissions)) {
      const assignedTo = toObjectId(user.userId);
      if (!assignedTo) {
        return {
          totalLeads: 0,
          newLeads: 0,
          hotLeads: 0,
          warmLeads: 0,
          coldLeads: 0,
          todayFollowUps: 0,
          tomorrowFollowUps: 0,
          overdueFollowUps: 0,
          todayVisits: 0,
          tomorrowVisits: 0,
          overdueVisits: 0,
          closedWon: 0,
          closedLost: 0,
          isAdminView: false,
        };
      }
      baseFilter.assignedTo = assignedTo;
      baseFilter.status = { $in: ACTIVE_LEAD_STATUSES };
      const leadIds = await LeadModel.find({ assignedTo, deletedAt: null, status: { $in: ACTIVE_LEAD_STATUSES } }).select('_id').lean();
      visitLeadFilter = {
        status: 'scheduled',
        leadId: { $in: leadIds.map((l) => l._id) },
      };
    }

    const [
      totalLeads,
      newLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      todayFollowUps,
      tomorrowFollowUps,
      overdueFollowUps,
      todayVisits,
      tomorrowVisits,
      overdueVisits,
      closedWon,
      closedLost,
    ] = await Promise.all([
      leadRepository.countByFilter(baseFilter),
      leadRepository.countByFilter({ ...baseFilter, status: 'open' }),
      leadRepository.countByFilter({
        ...baseFilter,
        priority: 'hot',
        status: { $in: ACTIVE_LEAD_STATUSES },
      }),
      leadRepository.countByFilter({
        ...baseFilter,
        priority: 'warm',
        status: { $in: ACTIVE_LEAD_STATUSES },
      }),
      leadRepository.countByFilter({
        ...baseFilter,
        priority: 'cold',
        status: { $in: ACTIVE_LEAD_STATUSES },
      }),
      leadRepository.countFollowUpsDue(baseFilter, now, 'today'),
      leadRepository.countFollowUpsDue(baseFilter, now, 'tomorrow'),
      leadRepository.countFollowUpsDue(baseFilter, now, 'overdue'),
      VisitModel.countDocuments({
        ...visitLeadFilter,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      }),
      VisitModel.countDocuments({
        ...visitLeadFilter,
        scheduledDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      }),
      VisitModel.countDocuments({
        ...visitLeadFilter,
        scheduledDate: { $lt: startOfDay },
      }),
      leadRepository.countByFilter({ ...baseFilter, status: 'closed' }),
      leadRepository.countByFilter({ ...baseFilter, status: 'closed' }),
    ]);

    return {
      totalLeads,
      newLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      todayFollowUps,
      tomorrowFollowUps,
      overdueFollowUps,
      todayVisits,
      tomorrowVisits,
      overdueVisits,
      closedWon,
      closedLost,
      isAdminView: canReadAllLeads(user.permissions),
    };
  },
};
