import { FilterQuery, Types } from 'mongoose';
import { VisitModel, IVisit } from '../../models/Visit.model';
import { VisitHistoryModel } from '../../models/VisitHistory.model';
import { VisitFavoriteModel } from '../../models/VisitFavorite.model';
import { LeadModel, ILead } from '../../models/Lead.model';
import { UserModel } from '../../models/User.model';
import { isValidObjectId, toObjectId } from '../../utils/objectId.utils';
import { CLOSED_LEAD_STATUSES, LEAD_STATUS_BUCKETS, LeadStatus } from '../../constants/lead.constants';
import { VisitHistoryAction } from '../../constants/visit.constants';

export interface ListVisitOptions {
  skip: number;
  limit: number;
  search?: string;
  type?: string;
  status?: string;
  favorite?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  assignedOnly?: boolean;
  assignedToUserId?: string;
  userId?: string;
}

async function getLeadIdsForAssignee(userId: string): Promise<Types.ObjectId[]> {
  const assignedTo = toObjectId(userId);
  if (!assignedTo) return [];
  const leads = await LeadModel.find({ assignedTo, deletedAt: null }).select('_id').lean();
  return leads.map((l) => l._id as Types.ObjectId);
}

async function getFavoriteVisitIds(userId: string): Promise<Types.ObjectId[]> {
  const favorites = await VisitFavoriteModel.find({ userId: toObjectId(userId) })
    .select('visitId')
    .lean();
  return favorites.map((f) => f.visitId as Types.ObjectId);
}

async function attachIsFavorite<T extends { _id: Types.ObjectId; leadId: Types.ObjectId }>(
  visits: T[],
  userId?: string
): Promise<(T & { isFavorite: boolean })[]> {
  if (!userId || visits.length === 0) {
    return visits.map((v) => ({ ...v, isFavorite: false }));
  }

  const favoriteIds = await getFavoriteVisitIds(userId);
  const favoriteLeadIds = await VisitModel.distinct('leadId', { _id: { $in: favoriteIds } });
  const favSet = new Set(favoriteLeadIds.map(String));

  return visits.map((v) => ({
    ...v,
    isFavorite: favSet.has(String(v.leadId)),
  }));
}

export const visitRepository = {
  findAll: async (options: ListVisitOptions) => {
    const query: FilterQuery<IVisit> = {};

    if (options.assignedOnly && options.assignedToUserId) {
      const leadIds = await getLeadIdsForAssignee(options.assignedToUserId);
      if (leadIds.length === 0) return { data: [], total: 0 };
      query.leadId = { $in: leadIds };
    }

    if (options.favorite !== undefined && options.userId) {
      const favoriteIds = await getFavoriteVisitIds(options.userId);
      const favoriteLeadIds = await VisitModel.distinct('leadId', { _id: { $in: favoriteIds } });
      query.$and = [...(Array.isArray(query.$and) ? query.$and : []), {leadId: options.favorite ? { $in: favoriteLeadIds } : { $nin: favoriteLeadIds }}];
    }

    if (options.type) query.type = options.type;
    if (options.status) {
      const bucket = LEAD_STATUS_BUCKETS[options.status as LeadStatus];
      const statusLeadIds = await LeadModel.distinct('_id', { status: { $in: bucket || CLOSED_LEAD_STATUSES } });
      query.$and = [...(Array.isArray(query.$and) ? query.$and : []), { leadId: bucket ? { $in: statusLeadIds } : { $nin: statusLeadIds } }];
      if (!bucket) query.status = options.status;
    }

    if (options.dateFrom || options.dateTo) {
      query.scheduledDate = {};
      if (options.dateFrom) {
        (query.scheduledDate as Record<string, Date>).$gte = new Date(`${options.dateFrom}T00:00:00.000Z`);
      }
      if (options.dateTo) {
        (query.scheduledDate as Record<string, Date>).$lte = new Date(`${options.dateTo}T23:59:59.999Z`);
      }
    }

    if (options.search) {
      const searchRegex = { $regex: options.search, $options: 'i' };
      const matchingUsers = await UserModel.find({
        $or: [
          { name: searchRegex },
          { employeeId: searchRegex },
          { email: searchRegex },
        ],
      }).select('_id').lean();
      const assignedToIds = matchingUsers.map((user) => user._id);
      const matchingLeads = await LeadModel.find({
        deletedAt: null,
        $or: [
          { customerName: searchRegex },
          { mobile: searchRegex },
          { leadId: searchRegex },
          { preferredArea: searchRegex },
          { city: searchRegex },
          { initialRemark: searchRegex },
          ...(assignedToIds.length ? [{ assignedTo: { $in: assignedToIds } }] : []),
        ],
      })
        .select('_id')
        .lean();
      const leadIds = matchingLeads.map((l) => l._id);
      const visitSearchClause: FilterQuery<IVisit>[] = [
        { remark: searchRegex },
      ];
      if (leadIds.length > 0) {
        visitSearchClause.push({ leadId: { $in: leadIds } });
      }
      const searchFilter = { $or: visitSearchClause };
      if (query.leadId && leadIds.length > 0) {
        const scopedIds = (query.leadId as { $in: Types.ObjectId[] }).$in.filter((id) =>
          leadIds.some((lid) => String(lid) === String(id))
        );
        query.$and = [...(Array.isArray(query.$and) ? query.$and : []), { $or: [{ leadId: { $in: scopedIds } }, { remark: searchRegex }] }];
      } else {
        query.$and = [...(Array.isArray(query.$and) ? query.$and : []), searchFilter];
      }
    }

    const sortFieldMap: Record<string, string> = {
      scheduledDate: 'scheduledDate',
      type: 'type',
      status: 'status',
      createdAt: 'createdAt',
    };
    const sortField = sortFieldMap[options.sortBy || ''] || 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    // Page customer groups, so an expanded visit entry always contains its full matching history.
    const matching = await VisitModel.find(query).sort({ [sortField]: sortDir, createdAt: -1 }).lean();
    const groupedIds = [...new Set(matching.map(visit => String(visit.leadId)))];
    const pageIds = new Set(groupedIds.slice(options.skip, options.skip + options.limit));
    const rawData = matching.filter(visit => pageIds.has(String(visit.leadId)));
    const total = groupedIds.length;

    const leadIds = [...new Set(rawData.map((v) => String(v.leadId)))];
    const leads = await LeadModel.find({ _id: { $in: leadIds } })
      .select('leadId customerName mobile assignedTo assignedAt status')
      .populate('assignedTo', 'name employeeId')
      .lean();
    const leadMap = new Map<string, ILead>(leads.map((l) => [String(l._id), l as ILead]));

    const withLeads = rawData.map((visit) => ({
      ...visit,
      status: CLOSED_LEAD_STATUSES.includes(leadMap.get(String(visit.leadId))?.status as never) ? 'closed' : visit.status,
      lead: leadMap.get(String(visit.leadId)) || null,
    }));

    const data = await attachIsFavorite(withLeads, options.userId);
    return { data, total };
  },

  findById: async (id: string, userId?: string) => {
    if (!isValidObjectId(id)) return null;
    const visit = await VisitModel.findById(id).lean();
    if (!visit) return null;

    const lead = await LeadModel.findById(visit.leadId)
      .select('leadId customerName mobile city address assignedTo assignedAt currentAssignmentId status')
      .populate('assignedTo', 'name employeeId')
      .lean();

    let isFavorite = false;
    if (userId) {
      const fav = await VisitFavoriteModel.findOne({
        userId: toObjectId(userId),
        visitId: visit._id,
      }).lean();
      isFavorite = !!fav;
    }

    return { ...visit, status: CLOSED_LEAD_STATUSES.includes(lead?.status as never) ? 'closed' : visit.status, lead, isFavorite };
  },

  create: async (data: Partial<IVisit>) => VisitModel.create(data),

  update: async (id: string, data: Partial<IVisit>) => {
    if (!isValidObjectId(id)) return null;
    return VisitModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  },

  toggleFavorite: async (visitId: string, userId: string) => {
    const uid = toObjectId(userId);
    const vid = toObjectId(visitId);
    if (!uid || !vid) return false;

    const visit = await VisitModel.findById(vid).lean();
    if (!visit) return false;
    const relatedIds = await VisitModel.distinct('_id', {leadId: visit.leadId});
    const existing = await VisitFavoriteModel.findOne({userId: uid, visitId: {$in: relatedIds}});
    if (existing) {
      await VisitFavoriteModel.deleteMany({userId: uid, visitId: {$in: relatedIds}});
      return false;
    }
    await VisitFavoriteModel.create({userId: uid, visitId: vid});
    return true;
  },

  getHistory: async (visitId: string) => {
    if (!isValidObjectId(visitId)) return [];
    return VisitHistoryModel.find({ visitId })
      .populate('performedBy', 'name employeeId')
      .sort({ performedAt: -1 })
      .lean();
  },

  addHistory: async (data: {
    visitId: Types.ObjectId;
    action: VisitHistoryAction;
    remark?: string;
    performedBy: Types.ObjectId;
    metadata?: Record<string, unknown>;
  }) => VisitHistoryModel.create({ ...data, performedAt: new Date() }),
};
