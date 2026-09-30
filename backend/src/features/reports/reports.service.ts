import { JwtPayload } from '../../types/api.types';
import { LeadModel } from '../../models/Lead.model';
import { VisitModel } from '../../models/Visit.model';
import { PropertyModel } from '../../models/Property.model';
import { UserModel } from '../../models/User.model';
import { LeadFollowUpModel } from '../../models/LeadFollowUp.model';
import { LeadSourceModel } from '../../models/LeadSource.model';
import { PropertyTypeModel } from '../../models/PropertyType.model';
import { PropertyInquiryModel } from '../../models/PropertyInquiry.model';
import {
  ACTIVE_LEAD_STATUSES,
  CLOSED_LEAD_STATUSES,
  STATUS_LABELS,
  LEAD_STATUS_BUCKETS,
  LeadStatus,
} from '../../constants/lead.constants';
import { VISIT_STATUS_LABELS, VisitStatus } from '../../constants/visit.constants';
import { toObjectId } from '../../utils/objectId.utils';
import { ReportFilters } from './reports.types';
import {
  buildLeadMatch,
  buildPropertyMatch,
  buildVisitMatch,
  getLast12Months,
  mapLeadSourceToBucket,
  parseReportFilters,
  resolveReportScope,
} from './reports.filters';

const ACTIVE_PROPERTY_STATUSES = ['available', 'under_negotiation', 'reserved'];

const PIE_LEAD_STATUSES: LeadStatus[] = ['open', 'hold', 'booked', 'closed'];

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

async function countLeads(filters: ReportFilters, scope: ReturnType<typeof resolveReportScope>, extra: Record<string, unknown> = {}) {
  return LeadModel.countDocuments({ ...buildLeadMatch(filters, scope), ...extra });
}

export const reportsService = {
  getOverview: async (user: JwtPayload, query: Record<string, unknown>) => {
    const filters = parseReportFilters(query);
    const scope = resolveReportScope(user, filters.employeeId);

    const leadMatch = buildLeadMatch(filters, scope);
    const propertyMatch = buildPropertyMatch(filters);
    const visitMatch = await buildVisitMatch(filters, scope);

    const employeeFilter = scope.isScoped
      ? { _id: toObjectId(scope.targetUserId), status: 'active' as const }
      : { status: 'active' as const };

    const [
      totalLeads,
      activeLeads,
      closedLeads,
      totalProperties,
      activeProperties,
      totalVisits,
      completedVisits,
      totalEmployees,
    ] = await Promise.all([
      LeadModel.countDocuments(leadMatch),
      LeadModel.countDocuments({ ...leadMatch, status: { $in: ACTIVE_LEAD_STATUSES } }),
      LeadModel.countDocuments({ ...leadMatch, status: { $in: CLOSED_LEAD_STATUSES } }),
      PropertyModel.countDocuments(propertyMatch),
      PropertyModel.countDocuments({ ...propertyMatch, status: { $in: ACTIVE_PROPERTY_STATUSES } }),
      VisitModel.countDocuments(visitMatch),
      VisitModel.countDocuments({ ...visitMatch, status: 'completed' }),
      scope.isScoped && !scope.isAdmin
        ? Promise.resolve(1)
        : UserModel.countDocuments(employeeFilter),
    ]);

    return {
      totalLeads,
      activeLeads,
      closedLeads,
      totalProperties,
      activeProperties,
      totalVisits,
      completedVisits,
      totalEmployees,
      isScoped: scope.isScoped && !scope.isAdmin,
    };
  },

  getLeads: async (user: JwtPayload, query: Record<string, unknown>) => {
    const filters = parseReportFilters(query);
    const scope = resolveReportScope(user, filters.employeeId);
    const leadMatch = buildLeadMatch(filters, scope);

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      followUpLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      closedWon,
      closedLost,
    ] = await Promise.all([
      LeadModel.countDocuments(leadMatch),
      countLeads(filters, scope, { status: 'open' }),
      countLeads(filters, scope, { status: 'open' }),
      countLeads(filters, scope, { status: 'pending' }),
      countLeads(filters, scope, { priority: 'hot', status: { $in: ACTIVE_LEAD_STATUSES } }),
      countLeads(filters, scope, { priority: 'warm', status: { $in: ACTIVE_LEAD_STATUSES } }),
      countLeads(filters, scope, { priority: 'cold', status: { $in: ACTIVE_LEAD_STATUSES } }),
      countLeads(filters, scope, { status: 'closed' }),
      countLeads(filters, scope, { status: 'closed' }),
    ]);

    const conversionRate = pct(closedWon, totalLeads);

    const statusCounts = await Promise.all(
      PIE_LEAD_STATUSES.map(async (status) => ({
        status,
        label: STATUS_LABELS[status],
        count: await LeadModel.countDocuments({ ...leadMatch, status: { $in: LEAD_STATUS_BUCKETS[status] } }),
      }))
    );

    const statusDistribution = statusCounts;

    const leadSources = await LeadSourceModel.find({ status: 'active' }).lean();
    const sourceBuckets = ['Website', 'Facebook', 'Instagram', 'Referral', 'Walk-in', 'Other'];
    const sourcePerformance: Record<string, number> = Object.fromEntries(sourceBuckets.map((b) => [b, 0]));

    for (const src of leadSources) {
      const count = await LeadModel.countDocuments({
        ...leadMatch,
        leadSource: src._id,
      });
      const bucket = mapLeadSourceToBucket(src.name, src.slug);
      sourcePerformance[bucket] = (sourcePerformance[bucket] || 0) + count;
    }

    const leadSourcePerformance = sourceBuckets.map((name) => ({
      name,
      count: sourcePerformance[name] || 0,
    }));

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await LeadModel.aggregate([
      { $match: { ...leadMatch, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthTemplate = getLast12Months();
    const monthlyTrend = monthTemplate.map(({ year, month, label }) => {
      const found = monthlyAgg.find((m) => m._id.year === year && m._id.month === month);
      return { label, year, month, count: found?.count ?? 0 };
    });

    return {
      kpis: {
        newLeads,
        contactedLeads,
        followUpLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        closedWon,
        closedLost,
        totalLeads,
      },
      conversionRate,
      leadSourcePerformance,
      statusDistribution,
      monthlyTrend,
    };
  },

  getEmployees: async (user: JwtPayload, query: Record<string, unknown>) => {
    const filters = parseReportFilters(query);
    const scope = resolveReportScope(user, filters.employeeId);

    const employeeQuery =
      scope.isScoped && !scope.isAdmin
        ? { _id: toObjectId(scope.targetUserId), status: 'active' }
        : { status: 'active' };

    const employees = await UserModel.find(employeeQuery)
      .select('name employeeId profileImage')
      .sort({ name: 1 })
      .lean();

    const rows = await Promise.all(
      employees.map(async (emp) => {
        const empId = emp._id;
        const empScope = { isScoped: true, targetUserId: String(empId), isAdmin: scope.isAdmin };
        const empFilters = { ...filters, employeeId: String(empId) };
        const leadMatch = buildLeadMatch(empFilters, empScope);
        const visitMatch = await buildVisitMatch(empFilters, empScope);

        const assignedLeads = await LeadModel.countDocuments(leadMatch);
        const [callsDone, followUpsAdded, visitsScheduled, visitsCompleted, closedLeads] =
          await Promise.all([
            LeadFollowUpModel.countDocuments({ createdBy: empId, type: 'call' }),
            LeadFollowUpModel.countDocuments({ createdBy: empId }),
            VisitModel.countDocuments({ ...visitMatch, status: 'scheduled' }),
            VisitModel.countDocuments({ ...visitMatch, status: 'completed' }),
            LeadModel.countDocuments({ ...leadMatch, status: 'closed' }),
          ]);

        return {
          _id: String(empId),
          name: emp.name,
          employeeId: emp.employeeId,
          profileImage: emp.profileImage,
          assignedLeads,
          callsDone,
          followUpsAdded,
          visitsScheduled,
          visitsCompleted,
          closedLeads,
          conversionRate: pct(closedLeads, assignedLeads),
        };
      })
    );

    const topByClosedLeads = [...rows].sort((a, b) => b.closedLeads - a.closedLeads).slice(0, 5);
    const topByConversion = [...rows]
      .filter((r) => r.assignedLeads > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);
    const topByVisitsCompleted = [...rows].sort((a, b) => b.visitsCompleted - a.visitsCompleted).slice(0, 5);

    return {
      employees: rows,
      topPerformers: {
        byClosedLeads: topByClosedLeads,
        byConversion: topByConversion,
        byVisitsCompleted: topByVisitsCompleted,
      },
    };
  },

  getProperties: async (user: JwtPayload, query: Record<string, unknown>) => {
    const filters = parseReportFilters(query);
    resolveReportScope(user, filters.employeeId);
    const propertyMatch = buildPropertyMatch(filters);

    const [
      totalProperties,
      buyProperties,
      sellProperties,
      rentProperties,
      publishedProperties,
      featuredProperties,
      soldProperties,
      rentedProperties,
    ] = await Promise.all([
      PropertyModel.countDocuments(propertyMatch),
      PropertyModel.countDocuments({ ...propertyMatch, purpose: 'buy' }),
      PropertyModel.countDocuments({ ...propertyMatch, purpose: 'sell' }),
      PropertyModel.countDocuments({ ...propertyMatch, purpose: 'rent' }),
      PropertyModel.countDocuments({ ...propertyMatch, publishOnWebsite: true }),
      PropertyModel.countDocuments({ ...propertyMatch, isFeatured: true }),
      PropertyModel.countDocuments({ ...propertyMatch, status: 'sold' }),
      PropertyModel.countDocuments({ ...propertyMatch, status: 'rented' }),
    ]);

    const purposeDistribution = [
      { name: 'Buy', count: buyProperties },
      { name: 'Sell', count: sellProperties },
      { name: 'Rent', count: rentProperties },
    ];

    const typeAgg = await PropertyModel.aggregate([
      { $match: propertyMatch },
      { $group: { _id: '$propertyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const propertyTypes = await PropertyTypeModel.find().lean();
    const typeMap = new Map(propertyTypes.map((t) => [String(t._id), t.name]));

    const propertyTypeReport = typeAgg.map((t) => ({
      name: typeMap.get(String(t._id)) || 'Unknown',
      count: t.count as number,
    }));

    const viewAgg = await PropertyModel.aggregate([
      { $match: propertyMatch },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewCount' },
          featuredViews: {
            $sum: { $cond: [{ $eq: ['$isFeatured', true] }, '$viewCount', 0] },
          },
          totalInquiries: { $sum: '$inquiryCount' },
        },
      },
    ]);

    const websiteAnalytics = {
      totalPropertyViews: viewAgg[0]?.totalViews ?? 0,
      totalPropertyInquiries: viewAgg[0]?.totalInquiries ?? 0,
      featuredPropertyViews: viewAgg[0]?.featuredViews ?? 0,
    };

    const topProperties = await PropertyModel.find(propertyMatch)
      .select('title propertyCode viewCount inquiryCount')
      .sort({ viewCount: -1 })
      .limit(10)
      .lean();

    const topViewedProperties = await Promise.all(
      topProperties.map(async (p) => {
        const lastInquiry = await PropertyInquiryModel.findOne({ propertyId: p._id })
          .sort({ createdAt: -1 })
          .select('createdAt')
          .lean();
        return {
          propertyName: p.title,
          propertyCode: p.propertyCode,
          views: p.viewCount ?? 0,
          inquiries: p.inquiryCount ?? 0,
          lastInquiryDate: lastInquiry?.createdAt?.toISOString() ?? null,
        };
      })
    );

    return {
      kpis: {
        totalProperties,
        buyProperties,
        sellProperties,
        rentProperties,
        publishedProperties,
        featuredProperties,
        soldProperties,
        rentedProperties,
      },
      purposeDistribution,
      propertyTypeReport,
      websiteAnalytics,
      topViewedProperties,
    };
  },

  getVisits: async (user: JwtPayload, query: Record<string, unknown>) => {
    const filters = parseReportFilters(query);
    const scope = resolveReportScope(user, filters.employeeId);
    const visitMatch = await buildVisitMatch(filters, scope);

    const [totalVisits, scheduledVisits, completedVisits, cancelledVisits, reVisits] =
      await Promise.all([
        VisitModel.countDocuments(visitMatch),
        VisitModel.countDocuments({ ...visitMatch, status: 'scheduled' }),
        VisitModel.countDocuments({ ...visitMatch, status: 'completed' }),
        VisitModel.countDocuments({ ...visitMatch, status: 'cancelled' }),
        VisitModel.countDocuments({ ...visitMatch, type: 'revisit' }),
      ]);

    const visitStatuses: VisitStatus[] = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
    const statusDistribution = await Promise.all(
      visitStatuses.map(async (status) => ({
        status,
        label: VISIT_STATUS_LABELS[status],
        count: await VisitModel.countDocuments({ ...visitMatch, status }),
      }))
    );

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await VisitModel.aggregate([
      { $match: { ...visitMatch, scheduledDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$scheduledDate' }, month: { $month: '$scheduledDate' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthTemplate = getLast12Months();
    const monthlyTrend = monthTemplate.map(({ year, month, label }) => {
      const found = monthlyAgg.find((m) => m._id.year === year && m._id.month === month);
      return { label, year, month, count: found?.count ?? 0 };
    });

    return {
      kpis: {
        totalVisits,
        scheduledVisits,
        completedVisits,
        cancelledVisits,
        reVisits,
      },
      statusDistribution,
      monthlyTrend,
    };
  },
};
