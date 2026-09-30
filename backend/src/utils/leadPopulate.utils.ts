import { Types } from 'mongoose';
import { PropertyTypeModel } from '../models/PropertyType.model';
import { LeadSourceModel } from '../models/LeadSource.model';
import { UserModel } from '../models/User.model';
import { isValidObjectId } from './objectId.utils';

type LeanDoc = Record<string, unknown>;

const collectIds = (docs: LeanDoc[], field: string): Types.ObjectId[] => {
  const ids = new Set<string>();
  for (const doc of docs) {
    const value = doc[field];
    if (isValidObjectId(String(value))) {
      ids.add(String(value));
    }
  }
  return [...ids].map((id) => new Types.ObjectId(id));
};

const normalizeStatus = (rawStatus: unknown): string => {
  const s = String(rawStatus || 'open').toLowerCase();
  if (['hold', 'on_hold', 'on-hold'].includes(s)) return 'hold';
  if (['booked', 'closed_won', 'book'].includes(s)) return 'booked';
  if (['closed', 'closed_lost', 'close'].includes(s)) return 'closed';
  return 'open';
};

export const enrichLeads = async <T extends LeanDoc>(leads: T[]): Promise<T[]> => {
  if (leads.length === 0) return leads;

  const propertyTypeIds = collectIds(leads, 'propertyType');
  const leadSourceIds = collectIds(leads, 'leadSource');
  const userIds = collectIds(leads, 'assignedTo');

  const [propertyTypes, leadSources, users] = await Promise.all([
    propertyTypeIds.length
      ? PropertyTypeModel.find({ _id: { $in: propertyTypeIds } }).select('name slug').lean()
      : [],
    leadSourceIds.length
      ? LeadSourceModel.find({ _id: { $in: leadSourceIds } }).select('name slug').lean()
      : [],
    userIds.length
      ? UserModel.find({ _id: { $in: userIds } }).select('name employeeId email profileImage').lean()
      : [],
  ]);

  const propertyTypeMap = new Map<string, any>();
  propertyTypes.forEach((item) => propertyTypeMap.set(String(item._id), item));
  const leadSourceMap = new Map<string, any>();
  leadSources.forEach((item) => leadSourceMap.set(String(item._id), item));
  const userMap = new Map<string, any>();
  users.forEach((item) => userMap.set(String(item._id), item));

  return leads.map((lead) => {
    const propertyTypeId = String(lead.propertyType ?? '');
    const leadSourceId = String(lead.leadSource ?? '');
    const assignedToId = String(lead.assignedTo ?? '');

    return {
      ...lead,
      status: normalizeStatus(lead.status),
      propertyType: isValidObjectId(propertyTypeId)
        ? propertyTypeMap.get(propertyTypeId) ?? lead.propertyType
        : lead.propertyType,
      leadSource: isValidObjectId(leadSourceId)
        ? leadSourceMap.get(leadSourceId) ?? lead.leadSource
        : lead.leadSource,
      assignedTo: isValidObjectId(assignedToId)
        ? userMap.get(assignedToId) ?? lead.assignedTo
        : lead.assignedTo,
    };
  });
};

export const enrichLeadDetail = async <T extends LeanDoc>(lead: T | null): Promise<T | null> => {
  if (!lead) return null;

  const [enriched] = await enrichLeads([lead]);
  const propertyTypeId = String(enriched.propertyType ?? '');
  const leadSourceId = String(enriched.leadSource ?? '');

  const userIds = [
    enriched.createdBy,
    enriched.updatedBy,
    ...(Array.isArray(enriched.notes)
      ? enriched.notes.map((note: LeanDoc) => note.createdBy)
      : []),
  ]
    .map((value) => String(value ?? ''))
    .filter(isValidObjectId);

  const users = userIds.length
    ? await UserModel.find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
        .select('name employeeId')
        .lean()
    : [];
  const userMap = new Map(users.map((user) => [String(user._id), user]));

  const mapUser = (value: unknown) => {
    const id = String(value ?? '');
    return isValidObjectId(id) ? userMap.get(id) ?? value : value;
  };

  return {
    ...enriched,
    propertyType: isValidObjectId(propertyTypeId) ? enriched.propertyType : enriched.propertyType,
    leadSource: isValidObjectId(leadSourceId) ? enriched.leadSource : enriched.leadSource,
    createdBy: mapUser(enriched.createdBy),
    updatedBy: mapUser(enriched.updatedBy),
    notes: Array.isArray(enriched.notes)
      ? enriched.notes.map((note: LeanDoc) => ({
          ...note,
          createdBy: mapUser(note.createdBy),
        }))
      : enriched.notes,
  };
};
