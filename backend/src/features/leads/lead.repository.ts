import { FilterQuery, Types } from 'mongoose';
import { LeadModel, ILead } from '../../models/Lead.model';
import { VisitModel, IVisit } from '../../models/Visit.model';
import { LeadAssignmentModel } from '../../models/LeadAssignment.model';
import { LeadFollowUpModel } from '../../models/LeadFollowUp.model';
import { LeadActivityModel } from '../../models/LeadActivity.model';
import { PropertyTypeModel } from '../../models/PropertyType.model';
import { UserModel } from '../../models/User.model';
import { ACTIVE_LEAD_STATUSES } from '../../constants/lead.constants';
import { LEAD_STATUS_BUCKETS } from '../../constants/lead.constants';
import { normalizeMobile } from '../../utils/mobile.utils';
import { enrichLeadDetail, enrichLeads } from '../../utils/leadPopulate.utils';
import { isValidObjectId, toObjectId } from '../../utils/objectId.utils';

export interface ListLeadOptions {
  skip: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  propertyType?: string;
  propertyConfiguration?: string;
  leadSource?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  assignedOnly?: boolean;
  assignedToUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  nfdFrom?: string;
  nfdTo?: string;
  followUpDue?: 'today' | 'tomorrow' | 'overdue';
}

const populateFields =
  'customerName mobile alternateMobile email city address category propertyType propertyConfiguration leadSource budgetMin budgetMax preferredArea priority status initialRemark assignedTo currentAssignmentId assignedAt nextFollowUpDate leadId createdAt updatedAt notes sharePreviousRemarks remarksRestrictedAt';

function getScheduleDateRanges(now = new Date()) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const tomorrowStart = new Date(startOfDay);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay, tomorrowStart, tomorrowEnd };
}

function buildFollowUpDueClause(type: 'today' | 'tomorrow' | 'overdue', now = new Date()): FilterQuery<ILead> {
  const { startOfDay, endOfDay, tomorrowStart, tomorrowEnd } = getScheduleDateRanges(now);

  if (type === 'today') {
    return {
      nextFollowUpDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_LEAD_STATUSES },
    };
  }
  if (type === 'tomorrow') {
    return {
      nextFollowUpDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $in: ACTIVE_LEAD_STATUSES },
    };
  }
  return {
    nextFollowUpDate: { $lt: startOfDay },
    status: 'open',
  };
}

async function getLeadIdsWithScheduledVisitsDue(
  type: 'today' | 'tomorrow' | 'overdue',
  options: Pick<ListLeadOptions, 'assignedOnly' | 'assignedToUserId'>,
  now = new Date()
): Promise<Types.ObjectId[]> {
  const { startOfDay, endOfDay, tomorrowStart, tomorrowEnd } = getScheduleDateRanges(now);
  const visitQuery: FilterQuery<IVisit> = { status: 'scheduled' };

  if (type === 'today') {
    visitQuery.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
  } else if (type === 'tomorrow') {
    visitQuery.scheduledDate = { $gte: tomorrowStart, $lte: tomorrowEnd };
  } else {
    visitQuery.scheduledDate = { $lt: startOfDay };
  }

  const activeLeadFilter: FilterQuery<ILead> = {
    deletedAt: null,
    status: type === 'overdue' ? 'open' : { $in: ACTIVE_LEAD_STATUSES },
  };

  if (options.assignedOnly && options.assignedToUserId) {
    const assignedTo = toObjectId(options.assignedToUserId);
    if (!assignedTo) return [];
    activeLeadFilter.assignedTo = assignedTo;
  }

  const activeLeads = await LeadModel.find(activeLeadFilter).select('_id').lean();
  const leadIds = activeLeads.map((lead) => lead._id as Types.ObjectId);
  if (leadIds.length === 0) return [];
  visitQuery.leadId = { $in: leadIds };

  return VisitModel.distinct('leadId', visitQuery);
}

function applyScheduleDueFilter(
  query: FilterQuery<ILead>,
  scheduleConditions: FilterQuery<ILead>[]
) {
  if (scheduleConditions.length === 0) return;

  const scheduleFilter =
    scheduleConditions.length === 1
      ? scheduleConditions[0]
      : { $or: scheduleConditions };

  if (query.$or) {
    const searchFilter = { $or: query.$or };
    delete query.$or;
    query.$and = [...(Array.isArray(query.$and) ? query.$and : []), searchFilter, scheduleFilter];
    return;
  }

  if (scheduleConditions.length === 1) {
    Object.assign(query, scheduleConditions[0]);
    return;
  }

  query.$or = scheduleConditions;
}

async function attachLastFollowUps<T extends Record<string, unknown>>(
  leads: T[],
  options?: { scopeToCurrentAssignment?: boolean }
): Promise<T[]> {
  if (leads.length === 0) return leads;

  const leadIds = leads.map((lead) => lead._id);

  if (options?.scopeToCurrentAssignment) {
    const assignmentPairs = leads
      .filter((lead) => lead.currentAssignmentId)
      .map((lead) => ({
        leadId: lead._id,
        ...(lead.sharePreviousRemarks ? {} : { assignmentId: lead.currentAssignmentId }),
      }));

    if (assignmentPairs.length === 0) return leads;

    const latest = await LeadFollowUpModel.aggregate([
      { $match: { $or: assignmentPairs } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$leadId',
          lastFollowUpRemark: { $first: '$remark' },
          lastFollowUpDate: { $first: '$followUpDate' },
        },
      },
    ]);

    const remarkMap = new Map(
      latest.map((item) => [
        String(item._id),
        {
          lastFollowUpRemark: item.lastFollowUpRemark as string | undefined,
          lastFollowUpDate: item.lastFollowUpDate as Date | undefined,
        },
      ])
    );

    return leads.map((lead) => {
      const extra = remarkMap.get(String(lead._id));
      const remark = extra?.lastFollowUpRemark || (!(lead as Record<string, unknown>).remarksRestrictedAt || lead.sharePreviousRemarks ? (lead as Record<string, unknown>).initialRemark as string | undefined : undefined);
      return extra
        ? { ...lead, ...extra, lastFollowUpRemark: remark }
        : { ...lead, lastFollowUpRemark: remark };
    });
  }

  const latest = await LeadFollowUpModel.aggregate([
    { $match: { leadId: { $in: leadIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$leadId',
        lastFollowUpRemark: { $first: '$remark' },
        lastFollowUpDate: { $first: '$followUpDate' },
      },
    },
  ]);

  const remarkMap = new Map(
    latest.map((item) => [
      String(item._id),
      {
        lastFollowUpRemark: item.lastFollowUpRemark as string | undefined,
        lastFollowUpDate: item.lastFollowUpDate as Date | undefined,
      },
    ])
  );

  return leads.map((lead) => {
    const extra = remarkMap.get(String(lead._id));
    const remark = extra?.lastFollowUpRemark || (lead as Record<string, unknown>).initialRemark as string | undefined;
    return extra
      ? { ...lead, ...extra, lastFollowUpRemark: remark }
      : { ...lead, lastFollowUpRemark: remark };
  });
}

export const leadRepository = {
  findAll: async (options: ListLeadOptions) => {
    const query: FilterQuery<ILead> = { deletedAt: null };

    if (options.assignedOnly && options.assignedToUserId) {
      const assignedToUserId = toObjectId(options.assignedToUserId);
      if (!assignedToUserId) {
        return { data: [], total: 0 };
      }
      query.assignedTo = assignedToUserId;
    } else if (!options.assignedOnly && options.assignedTo) {
      const assignedTo = toObjectId(options.assignedTo);
      if (assignedTo) query.assignedTo = assignedTo;
    }

    if (options.search) {
      const searchRegex = { $regex: options.search, $options: 'i' };
      const [matchingUsers, matchingPropertyTypes, matchingFollowUpLeadIds] = await Promise.all([
        UserModel.find({
          $or: [
            { name: searchRegex },
            { employeeId: searchRegex },
            { email: searchRegex },
            { mobile: searchRegex },
          ],
        }).select('_id').lean(),
        PropertyTypeModel.find({
          $or: [
            { name: searchRegex },
            { slug: searchRegex },
          ],
        }).select('_id').lean(),
        LeadFollowUpModel.distinct('leadId', {
          $or: [
            { remark: searchRegex },
            { type: searchRegex },
          ],
        }),
      ]);
      const assignedToIds = matchingUsers.map((user) => user._id);
      const propertyTypeIds = matchingPropertyTypes.map((type) => type._id);
      query.$or = [
        { customerName: searchRegex },
        { mobile: searchRegex },
        { alternateMobile: searchRegex },
        { email: searchRegex },
        { leadId: searchRegex },
        { propertyConfiguration: searchRegex },
        { preferredArea: searchRegex },
        { city: searchRegex },
        { address: searchRegex },
        { initialRemark: searchRegex },
        ...(assignedToIds.length ? [{ assignedTo: { $in: assignedToIds } }] : []),
        ...(propertyTypeIds.length ? [{ propertyType: { $in: propertyTypeIds } }] : []),
        ...(matchingFollowUpLeadIds.length ? [{ _id: { $in: matchingFollowUpLeadIds } }] : []),
      ];
    }

    if (options.dateFrom || options.dateTo) {
      query.createdAt = {};
      if (options.dateFrom) {
        (query.createdAt as Record<string, Date>).$gte = new Date(`${options.dateFrom}T00:00:00.000Z`);
      }
      if (options.dateTo) {
        (query.createdAt as Record<string, Date>).$lte = new Date(`${options.dateTo}T23:59:59.999Z`);
      }
    }

    if (options.nfdFrom || options.nfdTo) {
      query.nextFollowUpDate = {};
      if (options.nfdFrom) {
        (query.nextFollowUpDate as Record<string, Date>).$gte = new Date(`${options.nfdFrom}T00:00:00.000Z`);
      }
      if (options.nfdTo) {
        (query.nextFollowUpDate as Record<string, Date>).$lte = new Date(`${options.nfdTo}T23:59:59.999Z`);
      }
    }

    if (options.assignedOnly) {
      if (options.status && options.status !== 'all') {
        const bucket = LEAD_STATUS_BUCKETS[options.status as keyof typeof LEAD_STATUS_BUCKETS];
        const requested = bucket ? (bucket as readonly string[]) : [options.status];
        const allowed = requested.filter((s) => (ACTIVE_LEAD_STATUSES as readonly string[]).includes(s));
        if (allowed.length === 0) {
          return { data: [], total: 0 };
        }
        query.status = allowed.length === 1 ? allowed[0] : { $in: allowed };
      } else {
        query.status = { $in: ACTIVE_LEAD_STATUSES };
      }
    } else if (options.status && options.status !== 'all') {
      const bucket = LEAD_STATUS_BUCKETS[options.status as keyof typeof LEAD_STATUS_BUCKETS];
      query.status = bucket ? { $in: bucket } : options.status;
    }
    if (options.category) query.category = options.category;
    if (options.priority) {
      query.priority = options.priority;
      if ((!options.status || options.status === 'all') && !options.assignedOnly) {
        query.status = { $in: ACTIVE_LEAD_STATUSES };
      }
    }
    if (options.propertyType) {
      const propertyType = toObjectId(options.propertyType);
      if (propertyType) query.propertyType = propertyType;
    }
    if (options.propertyConfiguration) {
      query.propertyConfiguration = { $regex: options.propertyConfiguration, $options: 'i' };
    }
    if (options.leadSource) {
      const leadSource = toObjectId(options.leadSource);
      if (leadSource) query.leadSource = leadSource;
    }

    if (options.followUpDue) {
      if (!query.status) {
        query.status = options.followUpDue === 'overdue' ? 'open' : { $in: ACTIVE_LEAD_STATUSES };
      }
      const now = new Date();
      const visitLeadIds = await getLeadIdsWithScheduledVisitsDue(options.followUpDue, options, now);
      const scheduleConditions: FilterQuery<ILead>[] = [
        buildFollowUpDueClause(options.followUpDue, now),
      ];
      if (visitLeadIds.length > 0) {
        scheduleConditions.push({
          _id: { $in: visitLeadIds },
          status: options.followUpDue === 'overdue' ? 'open' : { $in: ACTIVE_LEAD_STATUSES },
        });
      }
      applyScheduleDueFilter(query, scheduleConditions);
    }

    const sortFieldMap: Record<string, string> = {
      customer: 'customerName',
      customerName: 'customerName',
      leadId: 'leadId',
      category: 'category',
      priority: 'priority',
      status: 'status',
      nextFollowUpDate: 'nextFollowUpDate',
      assignedAt: 'assignedAt',
      createdAt: 'createdAt',
    };
    const sortField = sortFieldMap[options.sortBy || ''] || 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    const [rawData, total] = await Promise.all([
      LeadModel.find(query)
        .select(populateFields)
        .sort({ [sortField]: sortDir })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      LeadModel.countDocuments(query),
    ]);

    const data = await enrichLeads(rawData);
    const withFollowUps = await attachLastFollowUps(data, {
      scopeToCurrentAssignment: Boolean(options.assignedOnly),
    });

    return { data: withFollowUps, total };
  },

  findById: async (id: string): Promise<ILead | null> => {
    if (!isValidObjectId(id)) return null;

    const lead = await LeadModel.findOne({ _id: id, deletedAt: null }).lean();
    return enrichLeadDetail(lead) as Promise<ILead | null>;
  },

  findByMobile: async (mobile: string) => {
    const normalized = normalizeMobile(mobile);
    const leads = await LeadModel.find({ mobile: normalized, deletedAt: null })
      .populate('assignedTo', 'name employeeId')
      .populate('propertyType', 'name')
      .populate('leadSource', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return attachLastFollowUps(leads as unknown as Record<string, unknown>[]);
  },

  findActiveByMobile: async (mobile: string) => {
    const normalized = normalizeMobile(mobile);
    return LeadModel.findOne({
      mobile: normalized,
      deletedAt: null,
      status: { $in: ACTIVE_LEAD_STATUSES },
    }).lean();
  },

  create: async (data: Partial<ILead>): Promise<ILead> => {
    return LeadModel.create(data);
  },

  update: async (id: string, data: Partial<ILead>): Promise<ILead | null> => {
    if (!isValidObjectId(id)) return null;

    await LeadModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return leadRepository.findById(id);
  },

  /** Sync denormalized Lead.nextFollowUpDate to the latest follow-up NFD (or clear it). */
  syncNextFollowUpDate: async (
    id: string,
    updatedBy: Types.ObjectId,
    nextFollowUpDate?: Date
  ): Promise<void> => {
    if (!isValidObjectId(id)) return;

    if (nextFollowUpDate) {
      await LeadModel.findByIdAndUpdate(id, {
        $set: { updatedBy, nextFollowUpDate },
      });
      return;
    }

    await LeadModel.findByIdAndUpdate(id, {
      $set: { updatedBy },
      $unset: { nextFollowUpDate: 1 },
    });
  },

  softDelete: async (id: string): Promise<ILead | null> => {
    return LeadModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  },

  createAssignment: async (data: {
    leadId: Types.ObjectId;
    assignedTo: Types.ObjectId;
    assignedBy: Types.ObjectId;
    sequence: number;
    transferRemark?: string;
  }) => {
    return LeadAssignmentModel.create({
      ...data,
      assignedAt: new Date(),
      isCurrent: true,
    });
  },

  closeCurrentAssignment: async (leadId: string, transferRemark?: string) => {
    return LeadAssignmentModel.findOneAndUpdate(
      { leadId, isCurrent: true },
      { isCurrent: false, transferredAt: new Date(), transferRemark },
      { new: true }
    );
  },

  getAssignments: async (leadId: string, assignedToUserId?: string) => {
    const query: FilterQuery<typeof LeadAssignmentModel> = { leadId };
    if (assignedToUserId) {
      const assignedTo = toObjectId(assignedToUserId);
      if (assignedTo) query.assignedTo = assignedTo;
    }
    return LeadAssignmentModel.find(query)
      .populate('assignedTo', 'name employeeId email')
      .populate('assignedBy', 'name employeeId')
      .sort({ sequence: -1 })
      .lean();
  },

  getNextAssignmentSequence: async (leadId: string) => {
    const last = await LeadAssignmentModel.findOne({ leadId }).sort({ sequence: -1 });
    return (last?.sequence ?? 0) + 1;
  },

  getFollowUps: async (leadId: string, assignmentId?: string, options?: { strict?: boolean }) => {
    const query: FilterQuery<typeof LeadFollowUpModel> = { leadId };
    if (assignmentId) {
      const id = toObjectId(assignmentId);
      if (id) query.assignmentId = id;
    } else if (options?.strict) {
      return [];
    }
    return LeadFollowUpModel.find(query)
      .populate('createdBy', 'name employeeId')
      .populate('parentActivity', 'name slug status')
      .populate('childActivity', 'name slug status parent')
      .sort({ followUpDate: -1, createdAt: -1 })
      .lean();
  },

  createFollowUp: async (data: Partial<typeof LeadFollowUpModel.prototype>) => {
    return LeadFollowUpModel.create(data);
  },

  getActivities: async (leadId: string, assignmentId?: string, options?: { strict?: boolean }) => {
    const query: FilterQuery<typeof LeadActivityModel> = { leadId };
    if (assignmentId) {
      const id = toObjectId(assignmentId);
      if (id) {
        query.$or = [
          { assignmentId: id },
          { type: 'LEAD_CREATED' },
        ];
      }
    } else if (options?.strict) {
      return [];
    }
    return LeadActivityModel.find(query)
      .populate('performedBy', 'name employeeId')
      .sort({ createdAt: -1 })
      .lean();
  },

  createActivity: async (data: {
    leadId: Types.ObjectId;
    assignmentId?: Types.ObjectId;
    type: string;
    title: string;
    remark?: string;
    performedBy: Types.ObjectId;
    metadata?: Record<string, unknown>;
  }) => {
    return LeadActivityModel.create(data);
  },

  countByFilter: async (filter: FilterQuery<ILead>) => {
    return LeadModel.countDocuments({ ...filter, deletedAt: null });
  },

  countFollowUpsDue: async (filter: FilterQuery<ILead>, date: Date, type: 'today' | 'tomorrow' | 'overdue') => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tomorrowStart = new Date(startOfDay);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const baseQuery: FilterQuery<ILead> = {
      ...filter,
      deletedAt: null,
      status: { $in: ACTIVE_LEAD_STATUSES },
    };

    if (type === 'today') {
      baseQuery.nextFollowUpDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (type === 'tomorrow') {
      baseQuery.nextFollowUpDate = { $gte: tomorrowStart, $lte: tomorrowEnd };
    } else {
      baseQuery.nextFollowUpDate = { $lt: startOfDay };
    }

    return LeadModel.countDocuments(baseQuery);
  },
};
