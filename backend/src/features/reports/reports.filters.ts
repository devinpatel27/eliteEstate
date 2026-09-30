import { FilterQuery, Types } from 'mongoose';
import { JwtPayload } from '../../types/api.types';
import { ILead } from '../../models/Lead.model';
import { IVisit } from '../../models/Visit.model';
import { IProperty } from '../../models/Property.model';
import { LeadModel } from '../../models/Lead.model';
import { AppError } from '../../middleware/error.middleware';
import { canReadAllLeads } from '../leads/lead.access';
import { isValidObjectId, toObjectId } from '../../utils/objectId.utils';
import { ReportFilters, ReportScope } from './reports.types';

const LEAD_CATEGORY_TO_PROPERTY_PURPOSE: Record<string, string> = {
  buy_property: 'buy',
  sell_property: 'sell',
  rent_property: 'rent',
};

export function parseReportFilters(query: Record<string, unknown>): ReportFilters {
  return {
    dateFrom: query.dateFrom as string | undefined,
    dateTo: query.dateTo as string | undefined,
    employeeId: query.employeeId as string | undefined,
    leadSourceId: query.leadSourceId as string | undefined,
    propertyTypeId: query.propertyTypeId as string | undefined,
    category: query.category as string | undefined,
  };
}

export function resolveReportScope(user: JwtPayload, employeeId?: string): ReportScope {
  const isAdmin = canReadAllLeads(user.permissions);

  if (employeeId && employeeId !== user.userId) {
    if (!isAdmin) {
      throw new AppError('Not authorized to view reports for other employees', 403);
    }
    if (!isValidObjectId(employeeId)) {
      throw new AppError('Invalid employee ID', 400);
    }
    return { isScoped: true, targetUserId: employeeId, isAdmin: true };
  }

  if (isAdmin && !employeeId) {
    return { isScoped: false, targetUserId: user.userId, isAdmin: true };
  }

  return { isScoped: true, targetUserId: user.userId, isAdmin: false };
}

function applyDateRange(
  match: FilterQuery<Record<string, unknown>>,
  field: string,
  dateFrom?: string,
  dateTo?: string
): void {
  if (!dateFrom && !dateTo) return;
  const range: Record<string, Date> = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  match[field] = range;
}

export function buildLeadMatch(filters: ReportFilters, scope: ReportScope): FilterQuery<ILead> {
  const match: FilterQuery<ILead> = { deletedAt: null };

  if (scope.isScoped) {
    const assignedTo = toObjectId(scope.targetUserId);
    if (!assignedTo) return { _id: { $in: [] } };
    match.assignedTo = assignedTo;
  }

  if (filters.leadSourceId && isValidObjectId(filters.leadSourceId)) {
    match.leadSource = toObjectId(filters.leadSourceId);
  }

  if (filters.propertyTypeId && isValidObjectId(filters.propertyTypeId)) {
    match.propertyType = toObjectId(filters.propertyTypeId);
  }

  if (filters.category && filters.category in LEAD_CATEGORY_TO_PROPERTY_PURPOSE) {
    match.category = filters.category as ILead['category'];
  }

  applyDateRange(match as FilterQuery<Record<string, unknown>>, 'createdAt', filters.dateFrom, filters.dateTo);
  return match;
}

export function buildPropertyMatch(filters: ReportFilters): FilterQuery<IProperty> {
  const match: FilterQuery<IProperty> = { deletedAt: null };

  if (filters.propertyTypeId && isValidObjectId(filters.propertyTypeId)) {
    match.propertyType = toObjectId(filters.propertyTypeId);
  }

  if (filters.category && LEAD_CATEGORY_TO_PROPERTY_PURPOSE[filters.category]) {
    match.purpose = LEAD_CATEGORY_TO_PROPERTY_PURPOSE[filters.category] as IProperty['purpose'];
  }

  applyDateRange(match as FilterQuery<Record<string, unknown>>, 'createdAt', filters.dateFrom, filters.dateTo);
  return match;
}

export async function getLeadIdsForScope(scope: ReportScope, filters: ReportFilters): Promise<Types.ObjectId[]> {
  const match = buildLeadMatch(filters, scope);
  const leads = await LeadModel.find(match).select('_id').lean();
  return leads.map((l) => l._id as Types.ObjectId);
}

export async function buildVisitMatch(
  filters: ReportFilters,
  scope: ReportScope
): Promise<FilterQuery<IVisit>> {
  const match: FilterQuery<IVisit> = {};
  const leadIds = await getLeadIdsForScope(scope, filters);

  if (scope.isScoped) {
    if (leadIds.length === 0) return { leadId: { $in: [] } };
    match.leadId = { $in: leadIds };
  } else if (filters.leadSourceId || filters.propertyTypeId || filters.category) {
    if (leadIds.length === 0) return { leadId: { $in: [] } };
    match.leadId = { $in: leadIds };
  }

  applyDateRange(match as FilterQuery<Record<string, unknown>>, 'scheduledDate', filters.dateFrom, filters.dateTo);
  return match;
}

export function getLast12Months(): { year: number; month: number; label: string }[] {
  const months: { year: number; month: number; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    });
  }
  return months;
}

const LEAD_SOURCE_BUCKETS: { key: string; patterns: string[] }[] = [
  { key: 'Website', patterns: ['website', 'website_property_inquiry', 'website_contact_form'] },
  { key: 'Facebook', patterns: ['facebook'] },
  { key: 'Instagram', patterns: ['instagram'] },
  { key: 'Referral', patterns: ['referral', 'existing_customer'] },
  { key: 'Walk-in', patterns: ['walk_in', 'walk-in', 'walkin'] },
];

export function mapLeadSourceToBucket(name: string, slug: string): string {
  const combined = `${name} ${slug}`.toLowerCase();
  for (const bucket of LEAD_SOURCE_BUCKETS) {
    if (bucket.patterns.some((p) => combined.includes(p.replace(/-/g, '_')))) {
      return bucket.key;
    }
  }
  return 'Other';
}
