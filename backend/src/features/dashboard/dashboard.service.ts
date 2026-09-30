import { FilterQuery, Types } from 'mongoose';
import { UserModel } from '../../models/User.model';
import { LeadModel, ILead } from '../../models/Lead.model';
import { VisitModel, IVisit } from '../../models/Visit.model';
import { LeadFollowUpModel } from '../../models/LeadFollowUp.model';
import { JwtPayload } from '../../types/api.types';
import { AppError } from '../../middleware/error.middleware';
import { canReadAllLeads, requiresAssignedOnlyScope } from '../leads/lead.access';
import { ACTIVE_LEAD_STATUSES } from '../../constants/lead.constants';
import { isValidObjectId, toObjectId, resolveRefId } from '../../utils/objectId.utils';
import { PERMISSIONS } from '../../constants/permissions';

type DateBucket = 'today' | 'tomorrow' | 'due';

const PERFORMANCE_GROUPS = {
  newEnquiry: ['open'],
  phoneCall: ['open'],
  siteVisit: ['pending'],
  multipleVisit: ['pending'],
  discussion: ['pending'],
  dealSucceed: ['closed'],
  dealLost: ['closed'],
} as const;

function getDateRanges(now = new Date()) {
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

function buildFollowUpDateQuery(bucket: DateBucket, now = new Date()): FilterQuery<ILead> {
  const { startOfDay, endOfDay, tomorrowStart, tomorrowEnd } = getDateRanges(now);
  const baseStatus = { status: 'open' };

  if (bucket === 'today') {
    return { nextFollowUpDate: { $gte: startOfDay, $lte: endOfDay }, ...baseStatus };
  }
  if (bucket === 'tomorrow') {
    return { nextFollowUpDate: { $gte: tomorrowStart, $lte: tomorrowEnd }, ...baseStatus };
  }
  return {
    nextFollowUpDate: { $lt: startOfDay },
    ...baseStatus,
  };
}

function buildVisitDateQuery(bucket: DateBucket, now = new Date()): FilterQuery<IVisit> {
  const { startOfDay, endOfDay, tomorrowStart, tomorrowEnd } = getDateRanges(now);
  const base: FilterQuery<IVisit> = { status: 'scheduled' };

  if (bucket === 'today') {
    return { ...base, scheduledDate: { $gte: startOfDay, $lte: endOfDay } };
  }
  if (bucket === 'tomorrow') {
    return { ...base, scheduledDate: { $gte: tomorrowStart, $lte: tomorrowEnd } };
  }
  return { ...base, scheduledDate: { $lt: startOfDay } };
}

async function getLeadIdsForAssignee(userId: string): Promise<Types.ObjectId[]> {
  const assignedTo = toObjectId(userId);
  if (!assignedTo) return [];
  const leads = await LeadModel.find({ assignedTo, deletedAt: null, status: 'open' }).select('_id').lean();
  return leads.map((l) => l._id as Types.ObjectId);
}

function resolveTargetUserId(user: JwtPayload, employeeId?: string): string {
  if (employeeId && employeeId !== user.userId) {
    const isAdmin =
      canReadAllLeads(user.permissions) ||
      user.permissions.includes(PERMISSIONS.EMPLOYEE_READ);
    if (!isAdmin) {
      throw new AppError('Not authorized to view this employee dashboard', 403);
    }
    if (!isValidObjectId(employeeId)) {
      throw new AppError('Invalid employee ID', 400);
    }
    return employeeId;
  }
  return user.userId;
}

async function buildLeadFilter(userId: string, isScopedToUser: boolean): Promise<FilterQuery<ILead>> {
  const filter: FilterQuery<ILead> = { deletedAt: null, status: 'open' };
  if (isScopedToUser) {
    const assignedTo = toObjectId(userId);
    if (!assignedTo) return { _id: { $in: [] } };
    filter.assignedTo = assignedTo;
  }
  return filter;
}

async function buildVisitLeadFilter(userId: string, isScopedToUser: boolean): Promise<FilterQuery<IVisit>> {
  const leadQuery: FilterQuery<ILead> = { deletedAt: null, status: 'open' };
  if (isScopedToUser) {
    const assignedTo = toObjectId(userId);
    if (!assignedTo) return { leadId: { $in: [] } };
    leadQuery.assignedTo = assignedTo;
  }
  const leads = await LeadModel.find(leadQuery).select('_id').lean();
  const leadIds = leads.map((l) => l._id as Types.ObjectId);
  if (leadIds.length === 0) return { leadId: { $in: [] } };
  return { leadId: { $in: leadIds } };
}

async function getEmployeeScheduleCounts(employeeId: string, now = new Date()) {
  const assignedTo = toObjectId(employeeId);
  if (!assignedTo) {
    return {
      visitsToday: 0,
      visitsTomorrow: 0,
      visitsDue: 0,
      followUpsToday: 0,
      followUpsTomorrow: 0,
      followUpsDue: 0,
    };
  }

  const leadFilter = { deletedAt: null, assignedTo, status: 'open' };
  const visitFilter = await buildVisitLeadFilter(employeeId, true);

  const buckets: DateBucket[] = ['today', 'tomorrow', 'due'];
  const counts = await Promise.all(
    buckets.flatMap((bucket) => [
      VisitModel.countDocuments({ ...visitFilter, ...buildVisitDateQuery(bucket, now) }),
      LeadModel.countDocuments({ ...leadFilter, ...buildFollowUpDateQuery(bucket, now) }),
    ])
  );

  return {
    visitsToday: counts[0] as number,
    followUpsToday: counts[1] as number,
    visitsTomorrow: counts[2] as number,
    followUpsTomorrow: counts[3] as number,
    visitsDue: counts[4] as number,
    followUpsDue: counts[5] as number,
  };
}

const mapLeadTask = (lead: Record<string, unknown>, includeAssignee = false) => ({
  _id: String(lead._id),
  leadId: lead.leadId as string,
  customerName: lead.customerName as string,
  mobile: lead.mobile as string,
  priority: lead.priority as string,
  status: lead.status as string,
  nextFollowUpDate: lead.nextFollowUpDate
    ? new Date(lead.nextFollowUpDate as string).toISOString()
    : undefined,
  source:
    (lead.leadSource as { name?: string } | undefined)?.name ||
    (lead.leadSource as string | undefined) ||
    '—',
  ...(includeAssignee && lead.assignedTo
    ? {
        assignedToName:
          (lead.assignedTo as { name?: string })?.name ||
          undefined,
      }
    : {}),
});

const mapVisitTask = (visit: Record<string, unknown>) => {
  const lead = visit.lead as Record<string, unknown> | undefined;
  return {
    _id: String(visit._id),
    type: visit.type as string,
    status: visit.status as string,
    scheduledDate: new Date(visit.scheduledDate as string).toISOString(),
    scheduledTime: visit.scheduledTime as string | undefined,
    remark: visit.remark as string | undefined,
    lead: lead
      ? {
          _id: String(lead._id),
          leadId: lead.leadId as string,
          customerName: lead.customerName as string,
          mobile: lead.mobile as string,
          priority: lead.priority as string,
        }
      : undefined,
  };
};

export const dashboardService = {
  getOverview: async (user: JwtPayload, employeeId?: string) => {
    const targetUserId = resolveTargetUserId(user, employeeId);
    const isPreview = Boolean(employeeId && employeeId !== user.userId);
    const hasAdminAccess = canReadAllLeads(user.permissions);
    const viewMode: 'admin' | 'employee' | 'preview' = isPreview
      ? 'preview'
      : hasAdminAccess
        ? 'admin'
        : 'employee';
    const isScopedToUser = viewMode !== 'admin';
    const isAdminView = viewMode === 'admin';

    const [employee, leadFilter, visitLeadFilter] = await Promise.all([
      UserModel.findById(targetUserId).populate('role', 'roleName').select('name employeeId profileImage role').lean(),
      buildLeadFilter(targetUserId, isScopedToUser),
      buildVisitLeadFilter(targetUserId, isScopedToUser),
    ]);

    if (!employee) throw new AppError('Employee not found', 404);

    const now = new Date();
    const buckets: DateBucket[] = ['today', 'tomorrow', 'due'];
    const includeAssignee = isAdminView;

    const [
      freshLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      ...bucketResults
    ] = await Promise.all([
      LeadModel.countDocuments({ ...leadFilter, status: 'open' }),
      LeadModel.countDocuments({ ...leadFilter, priority: 'hot', status: { $in: ACTIVE_LEAD_STATUSES } }),
      LeadModel.countDocuments({ ...leadFilter, priority: 'warm', status: { $in: ACTIVE_LEAD_STATUSES } }),
      LeadModel.countDocuments({ ...leadFilter, priority: 'cold', status: { $in: ACTIVE_LEAD_STATUSES } }),
      ...buckets.flatMap((bucket) => [
        LeadModel.find({ ...leadFilter, ...buildFollowUpDateQuery(bucket, now) })
          .select('leadId customerName mobile priority status nextFollowUpDate leadSource assignedTo')
          .populate('leadSource', 'name')
          .populate('assignedTo', 'name')
          .sort({ nextFollowUpDate: 1 })
          .limit(20)
          .lean(),
        VisitModel.find({ ...visitLeadFilter, ...buildVisitDateQuery(bucket, now) })
          .populate({
            path: 'leadId',
            select: 'leadId customerName mobile priority status assignedTo',
            populate: { path: 'assignedTo', select: 'name' },
          })
          .sort({ scheduledDate: 1 })
          .limit(20)
          .lean(),
        LeadModel.countDocuments({ ...leadFilter, ...buildFollowUpDateQuery(bucket, now) }),
        VisitModel.countDocuments({ ...visitLeadFilter, ...buildVisitDateQuery(bucket, now) }),
        LeadModel.distinct('_id', { ...leadFilter, ...buildFollowUpDateQuery(bucket, now) }),
        VisitModel.distinct('leadId', { ...visitLeadFilter, ...buildVisitDateQuery(bucket, now) }),
      ]),
    ]);

    const visitTasks: Record<DateBucket, ReturnType<typeof mapVisitTask>[]> = {
      today: [],
      tomorrow: [],
      due: [],
    };
    const leadTasks: Record<DateBucket, ReturnType<typeof mapLeadTask>[]> = {
      today: [],
      tomorrow: [],
      due: [],
    };
    const timeline = {
      visits: { today: 0, tomorrow: 0, due: 0 },
      followUps: { today: 0, tomorrow: 0, due: 0 },
      unique: { today: 0, tomorrow: 0, due: 0 },
    };

    buckets.forEach((bucket, index) => {
      const offset = index * 6;
      const leadDocs = bucketResults[offset] as Record<string, unknown>[];
      const visitDocs = bucketResults[offset + 1] as Record<string, unknown>[];
      const leadCount = bucketResults[offset + 2] as number;
      const visitCount = bucketResults[offset + 3] as number;
      const followUpLeadIds = bucketResults[offset + 4] as Types.ObjectId[];
      const visitLeadIds = bucketResults[offset + 5] as Types.ObjectId[];

      leadTasks[bucket] = leadDocs.map((l) => mapLeadTask(l, includeAssignee));
      visitTasks[bucket] = visitDocs.map((v) =>
        mapVisitTask({ ...v, lead: v.leadId as Record<string, unknown> })
      );
      timeline.followUps[bucket] = leadCount;
      timeline.visits[bucket] = visitCount;
      timeline.unique[bucket] = new Set([
        ...followUpLeadIds.map(String),
        ...visitLeadIds.map(String),
      ]).size;
    });

    return {
      employee: {
        _id: String(employee._id),
        name: employee.name,
        employeeId: employee.employeeId,
        role: (employee.role as { roleName?: string })?.roleName || 'Employee',
        profileImage: employee.profileImage,
      },
      isAdminView,
      isPreview,
      viewMode,
      freshLeads,
      timeline,
      thermal: { hot: hotLeads, warm: warmLeads, cold: coldLeads },
      visitTasks,
      leadTasks,
    };
  },

  getEmployeePerformance: async (user: JwtPayload) => {
    if (!canReadAllLeads(user.permissions)) {
      throw new AppError('Not authorized to view employee performance', 403);
    }

    const employees = await UserModel.find({ status: 'active' })
      .populate('role', 'roleName')
      .select('name employeeId profileImage role')
      .sort({ name: 1 })
      .lean();

    const now = new Date();
    const rows = await Promise.all(
      employees.map(async (emp) => {
        const assignedTo = emp._id as Types.ObjectId;
        const metrics = {
          newEnquiry: 0,
          phoneCall: 0,
          siteVisit: 0,
          multipleVisit: 0,
          discussion: 0,
          dealSucceed: 0,
          dealLost: 0,
        };

        await Promise.all(
          (Object.keys(PERFORMANCE_GROUPS) as (keyof typeof PERFORMANCE_GROUPS)[]).map(
            async (key) => {
              metrics[key] = await LeadModel.countDocuments({
                deletedAt: null,
                assignedTo,
                status: { $in: PERFORMANCE_GROUPS[key] },
              });
            }
          )
        );

        const schedule = await getEmployeeScheduleCounts(String(emp._id), now);

        return {
          _id: String(emp._id),
          name: emp.name,
          employeeId: emp.employeeId,
          role: (emp.role as { roleName?: string })?.roleName || 'Employee',
          profileImage: emp.profileImage,
          metrics,
          schedule,
        };
      })
    );

    const summary = rows.reduce(
      (acc, row) => {
        (Object.keys(acc.metrics) as (keyof typeof acc.metrics)[]).forEach((key) => {
          acc.metrics[key] += row.metrics[key];
        });
        (Object.keys(acc.schedule) as (keyof typeof acc.schedule)[]).forEach((key) => {
          acc.schedule[key] += row.schedule[key];
        });
        return acc;
      },
      {
        metrics: {
          newEnquiry: 0,
          phoneCall: 0,
          siteVisit: 0,
          multipleVisit: 0,
          discussion: 0,
          dealSucceed: 0,
          dealLost: 0,
        },
        schedule: {
          visitsToday: 0,
          visitsTomorrow: 0,
          visitsDue: 0,
          followUpsToday: 0,
          followUpsTomorrow: 0,
          followUpsDue: 0,
        },
      }
    );

    return { summary: summary.metrics, scheduleSummary: summary.schedule, employees: rows };
  },

  getEmployeeLeadStream: async (user: JwtPayload, employeeId: string) => {
    if (!canReadAllLeads(user.permissions)) {
      throw new AppError('Not authorized', 403);
    }
    if (!isValidObjectId(employeeId)) {
      throw new AppError('Invalid employee ID', 400);
    }

    const leads = await LeadModel.find({
      deletedAt: null,
      assignedTo: toObjectId(employeeId),
      status: { $in: ACTIVE_LEAD_STATUSES },
    })
      .select('leadId customerName mobile email priority status nextFollowUpDate leadSource createdAt')
      .populate('leadSource', 'name')
      .sort({ nextFollowUpDate: 1, createdAt: -1 })
      .limit(50)
      .lean();

    return leads.map((lead) => ({
      ...mapLeadTask(lead as unknown as Record<string, unknown>),
      email: lead.email,
      createdAt: lead.createdAt,
    }));
  },

  getLeadFollowUpJourney: async (user: JwtPayload, leadId: string) => {
    if (!isValidObjectId(leadId)) throw new AppError('Invalid lead ID', 400);

    const lead = await LeadModel.findOne({ _id: leadId, deletedAt: null })
      .select('assignedTo customerName leadId')
      .lean();
    if (!lead) throw new AppError('Lead not found', 404);

    if (requiresAssignedOnlyScope(user.permissions)) {
      const assignedTo = resolveRefId(lead.assignedTo);
      if (assignedTo !== user.userId) {
        throw new AppError('Not authorized', 403);
      }
    }

    const followUps = await LeadFollowUpModel.find({ leadId: lead._id })
      .populate('createdBy', 'name')
      .sort({ followUpDate: -1, createdAt: -1 })
      .limit(30)
      .lean();

    return followUps.map((f) => ({
      _id: String(f._id),
      type: f.type,
      remark: f.remark,
      followUpDate: f.followUpDate,
      followUpTime: f.followUpTime,
      nextFollowUpDate: f.nextFollowUpDate,
      createdBy: (f.createdBy as { name?: string })?.name,
      createdAt: f.createdAt,
    }));
  },
};
