import dns from 'dns';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import sql from 'mssql';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { env } from '../config/env';
import { seedAdmin } from './seedAdmin';
import { seedMasters } from './seedMasters';
import { UserModel } from '../models/User.model';
import { RoleModel } from '../models/Role.model';
import { LeadModel } from '../models/Lead.model';
import { LeadAssignmentModel } from '../models/LeadAssignment.model';
import { LeadFollowUpModel } from '../models/LeadFollowUp.model';
import { LeadActivityModel } from '../models/LeadActivity.model';
import { LeadSourceModel } from '../models/LeadSource.model';
import { PropertyTypeModel } from '../models/PropertyType.model';
import { FollowUpActivityModel } from '../models/FollowUpActivity.model';
import { PropertyModel } from '../models/Property.model';
import { VisitModel } from '../models/Visit.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { hashPassword } from '../utils/bcrypt.utils';
import { slugifyTitle } from '../utils/propertyCode.utils';
import { EMPLOYEE_LEAD_PERMISSIONS } from '../constants/permissions';
import { FollowUpType, LeadCategory, LeadPriority, LeadStatus } from '../constants/lead.constants';
import { FurnishedStatus, PropertyPurpose, PropertyStatus } from '../constants/property.constants';
import { VisitStatus, VisitType } from '../constants/visit.constants';

dns.setServers(['8.8.8.8', '1.1.1.1']);

type Id = mongoose.Types.ObjectId;

type OldUser = {
  UserId: number;
  FirstName: string;
  LastName: string;
  Email: string | null;
  PhoneNumber: string | null;
  RoleId: number;
  ParentId: number;
  IsActive: boolean;
  DateOfJoin: Date;
  CreatedOn: Date;
};

type OldLead = {
  Id: number;
  NameOfClient: string;
  MobileNo: string;
  Email: string;
  EnquiryFor: number | null;
  Remark: string;
  LastRemark: string;
  AssignTo: number;
  AssignBy: number;
  Nfd: Date | null;
  AreaId: string;
  IsClosed: boolean | null;
  Mobile1: string;
  Mobile2: string;
  Mobile3: string;
  SourceId: number | null;
  BhkOfficeId: number | null;
  EnquiryStatusId: number | null;
  BudgetId: number | null;
  CreatedBy: number;
  CreatedOn: Date;
  UpdatedOn: Date | null;
};

type OldRemark = {
  Id: number;
  EnquiryId: number;
  ActivityChildId: number | null;
  Nfd: Date | null;
  EnquiryStatusId: number;
  Remark: string;
  CreatedBy: number;
  CreatedOn: Date;
};

type OldProperty = {
  Id: number;
  UserId: number;
  PropertyFor: number;
  Address: string;
  Block: string;
  FlatNumber: string;
  SuperBuiltupArea: number | null;
  CarpetArea: number | null;
  BuiltupArea: number | null;
  FurnitureStatusId: number | null;
  Parking: string;
  KeyStatus: string | null;
  PropertyPrice: number | null;
  OwnerName: string;
  Mobile: string;
  Mobile1: string;
  Mobile2: string;
  Comission: string;
  Remark: string;
  AvailableFrom: Date | null;
  BhkOfficeId: number | null;
  BuildingId: number | null;
  AreaId: number | null;
  MeasurementId: number | null;
  SourceId: number | null;
  PropertyStatusId: number | null;
  CreatedBy: number;
  CreatedOn: Date;
  UpdatedOn: Date | null;
};

type OldLog = {
  Id: number;
  Description: string;
  Module: number;
  PageName: string | null;
  IpAddress: string | null;
  CreatedBy: number;
  CreatedOn: Date;
};

const sqlConfig: sql.config = {
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || '',
  server: process.env.SQL_HOST || '127.0.0.1',
  port: Number(process.env.SQL_PORT || 11433),
  database: process.env.SQL_DATABASE || 'legacy_crm',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  requestTimeout: 120000,
};

const report = {
  users: { inserted: 0, matched: 0 },
  masters: { sources: 0, propertyTypes: 0, activities: 0 },
  leads: { inserted: 0, skipped: 0 },
  followUps: { inserted: 0, skippedLeads: 0 },
  visits: { inserted: 0 },
  properties: { inserted: 0, skipped: 0 },
  logs: { inserted: 0, skipped: 0 },
  warnings: [] as string[],
};

const warningSet = new Set<string>();

function warn(message: string) {
  if (warningSet.has(message)) return;
  warningSet.add(message);
  report.warnings.push(message);
}

const clean = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

const toSlug = (name: string): string =>
  clean(name).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'legacy';

const mobile10 = (value: unknown): string => clean(value).replace(/\D/g, '').slice(-10);

const dateOrNow = (value: Date | null | undefined): Date =>
  value && !Number.isNaN(value.getTime()) ? value : new Date();

const nameOf = (first: string, last: string, fallback: string): string =>
  clean(`${clean(first)} ${clean(last)}`) || fallback;

async function q<T>(pool: sql.ConnectionPool, query: string): Promise<T[]> {
  const result = await pool.request().query<T>(query);
  return result.recordset;
}

async function ensureRole(roleName: string, admin = false) {
  return RoleModel.findOneAndUpdate(
    { roleName },
    {
      $setOnInsert: {
        roleName,
        permissions: admin ? ['*'] : EMPLOYEE_LEAD_PERMISSIONS,
        description: admin ? 'Legacy administrator role' : 'Legacy employee role',
        status: 'active',
        isSystem: true,
      },
    },
    { upsert: true, new: true }
  );
}

async function migrateUsers(pool: sql.ConnectionPool) {
  const users = await q<OldUser>(pool, 'SELECT * FROM AspNetUsers ORDER BY UserId');
  const adminRole = await ensureRole('master_admin', true);
  const employeeRole = await ensureRole('employee', false);
  const password = await hashPassword('Employee@123');
  const byOldId = new Map<number, Id>();

  for (const old of users) {
    const email = clean(old.Email) || `legacy.user${old.UserId}@eliteestate.local`;
    const existing = await UserModel.findOne({ $or: [{ email: email.toLowerCase() }, { employeeId: `OLDUSR${old.UserId}` }] });
    if (existing) {
      byOldId.set(old.UserId, existing._id as Id);
      report.users.matched += 1;
      continue;
    }

    const user = await UserModel.create({
      employeeId: `OLDUSR${old.UserId}`,
      name: nameOf(old.FirstName, old.LastName, `Legacy User ${old.UserId}`),
      email,
      mobile: mobile10(old.PhoneNumber) || undefined,
      password,
      role: old.RoleId === 1 ? adminRole._id : employeeRole._id,
      status: old.IsActive ? 'active' : 'inactive',
      joiningDate: old.DateOfJoin || old.CreatedOn,
      forcePasswordChange: true,
    });
    byOldId.set(old.UserId, user._id as Id);
    report.users.inserted += 1;
  }

  const admin = await UserModel.findOne({ email: env.ADMIN_EMAIL });
  if (!admin) throw new Error('Master admin missing after seed.');
  byOldId.set(0, admin._id as Id);
  return { byOldId, defaultUserId: admin._id as Id };
}

async function upsertSimpleMaster(model: typeof LeadSourceModel | typeof PropertyTypeModel, name: string, sortOrder: number) {
  const safeName = clean(name) || 'Other';
  const slug = toSlug(safeName);
  const doc = await model.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name: safeName, slug, status: 'active', sortOrder } },
    { upsert: true, new: true }
  );
  return doc._id as Id;
}

function buildLookup<T extends { Id: number }>(rows: T[]) {
  return new Map(rows.map((row) => [row.Id, row]));
}

async function migrateMasters(pool: sql.ConnectionPool) {
  const sources = await q<{ Id: number; Name: string }>(pool, 'SELECT Id, Name FROM Tbl_Source ORDER BY Id');
  const propertyTypes = await q<{ Id: number; Name: string }>(pool, 'SELECT Id, Name FROM Tbl_PropertyType ORDER BY Id');
  const segments = await q<{ Id: number; Name: string; PropertyTypeId: number }>(pool, 'SELECT Id, Name, PropertyTypeId FROM Tbl_Segment ORDER BY Id');
  const bhk = await q<{ Id: number; Name: string; SegmentId: number }>(pool, 'SELECT Id, Name, SegmentId FROM Tbl_BhkOffice ORDER BY Id');
  const budgets = await q<{ Id: number; Name: string; From: number; To: number; For: number; BhkOfficeId: number }>(pool, 'SELECT Id, Name, [From], [To], [For], BhkOfficeId FROM Tbl_Budget ORDER BY Id');
  const areas = await q<{ Id: number; Name: string }>(pool, 'SELECT Id, Name FROM Tbl_Area ORDER BY Id');
  const parents = await q<{ Id: number; Name: string; IsActive: boolean }>(pool, 'SELECT Id, Name, IsActive FROM Tbl_ActivityParent ORDER BY Id');
  const children = await q<{ Id: number; Name: string; IsActive: boolean; ActivityParentId: number }>(pool, 'SELECT Id, Name, IsActive, ActivityParentId FROM Tbl_ActivityChild ORDER BY Id');

  const sourceMap = new Map<number, Id>();
  for (const source of sources) {
    sourceMap.set(source.Id, await upsertSimpleMaster(LeadSourceModel, source.Name, source.Id));
    report.masters.sources += 1;
  }
  const otherSource = await upsertSimpleMaster(LeadSourceModel, 'Other', 999);

  const propertyTypeMap = new Map<number, Id>();
  for (const type of propertyTypes) {
    propertyTypeMap.set(type.Id, await upsertSimpleMaster(PropertyTypeModel, type.Name, type.Id));
    report.masters.propertyTypes += 1;
  }
  const fallbackPropertyType = await upsertSimpleMaster(PropertyTypeModel, 'Residential', 1);

  const segmentMap = buildLookup(segments);
  const bhkMap = buildLookup(bhk);
  const budgetMap = buildLookup(budgets);
  const areaMap = buildLookup(areas);

  const parentMap = new Map<number, Id>();
  for (const parent of parents) {
    const slug = toSlug(parent.Name);
    const doc = await FollowUpActivityModel.findOneAndUpdate(
      { slug, parent: { $exists: false } },
      { name: clean(parent.Name), slug, status: parent.IsActive ? 'active' : 'inactive', sortOrder: parent.Id },
      { upsert: true, new: true }
    );
    parentMap.set(parent.Id, doc._id as Id);
    report.masters.activities += 1;
  }

  const childMap = new Map<number, { id: Id; name: string; parentId?: Id; parentName?: string }>();
  for (const child of children) {
    const parentId = parentMap.get(child.ActivityParentId);
    if (!parentId) continue;
    const slug = toSlug(child.Name);
    const doc = await FollowUpActivityModel.findOneAndUpdate(
      { slug, parent: parentId },
      {
        name: clean(child.Name),
        slug,
        parent: parentId,
        status: child.IsActive ? 'active' : 'inactive',
        sortOrder: child.Id,
      },
      { upsert: true, new: true }
    );
    const parentName = clean(parents.find((p) => p.Id === child.ActivityParentId)?.Name);
    childMap.set(child.Id, { id: doc._id as Id, name: clean(child.Name), parentId, parentName });
    report.masters.activities += 1;
  }

  return {
    sourceMap,
    otherSource,
    propertyTypeMap,
    fallbackPropertyType,
    segmentMap,
    bhkMap,
    budgetMap,
    areaMap,
    childMap,
  };
}

function propertyTypeFromBhk(
  bhkId: number | null,
  maps: Awaited<ReturnType<typeof migrateMasters>>
): Id {
  if (!bhkId) return maps.fallbackPropertyType;
  const bhk = maps.bhkMap.get(bhkId);
  const segment = bhk ? maps.segmentMap.get(bhk.SegmentId) : undefined;
  return (segment && maps.propertyTypeMap.get(segment.PropertyTypeId)) || maps.fallbackPropertyType;
}

function propertyConfiguration(bhkId: number | null, maps: Awaited<ReturnType<typeof migrateMasters>>) {
  if (!bhkId) return undefined;
  return clean(maps.bhkMap.get(bhkId)?.Name) || undefined;
}

function parseBudgetName(raw: string): { min?: number; max?: number } {
  const text = clean(raw).toLowerCase().replace(/\s+/g, '');
  const match = text.match(/([\d.]+)\s*[-–]\s*([\d.]+)\s*([a-z+.]*)/i);
  if (!match) return {};
  const unit = match[3] || '';
  const value = (rawValue: string, fallbackUnit: string) => {
    const n = Number(rawValue);
    if (Number.isNaN(n)) return undefined;
    if (/cr|crore/.test(fallbackUnit)) return Math.round(n * 10000000);
    if (/k/.test(fallbackUnit)) return Math.round(n * 1000);
    if (/l|lac|lakh/.test(fallbackUnit)) return Math.round(n * 100000);
    return n < 1000 ? Math.round(n * 100000) : Math.round(n);
  };
  const min = value(match[1], unit);
  const max = value(match[2], unit);
  return { min, max };
}

function budgetFrom(id: number | null, maps: Awaited<ReturnType<typeof migrateMasters>>) {
  if (!id) return {};
  const budget = maps.budgetMap.get(id);
  if (!budget) return {};
  let min = Number(budget.From);
  let max = Number(budget.To);
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;

  if (max > 0 && min > max) {
    const parsed = parseBudgetName(budget.Name);
    if (parsed.min && parsed.max) {
      warn(`Budget ${budget.Id} had invalid range ${min}-${max}; used name "${budget.Name}".`);
      min = parsed.min;
      max = parsed.max;
    } else {
      [min, max] = [max, min];
      warn(`Budget ${budget.Id} had invalid range; swapped values.`);
    }
  }

  if (max > 0 && max < 1000 && /lac|lacs|l|cr/i.test(budget.Name)) {
    const parsed = parseBudgetName(budget.Name);
    if (parsed.min && parsed.max) {
      min = parsed.min;
      max = parsed.max;
      warn(`Budget ${budget.Id} looked abbreviated; used name "${budget.Name}".`);
    }
  }

  return { budgetMin: min || undefined, budgetMax: max || undefined };
}

function leadCategory(value: number | null): LeadCategory {
  if (value === 1) return 'rent_property';
  return 'buy_property';
}

function leadStatus(value: number | null, isClosed?: boolean | null): LeadStatus {
  if (isClosed || value === 2) return 'closed';
  if (value === 3) return 'hold';
  return 'open';
}

function priorityFor(status: LeadStatus, lastRemark: string): LeadPriority {
  const text = lastRemark.toLowerCase();
  if (status === 'closed') return 'cold';
  if (/visit|deal|token|final|interested|done/.test(text)) return 'hot';
  if (/not interested|purchased|post.?pond|hold/.test(text)) return 'cold';
  return 'warm';
}

function inferFollowUpType(parentName?: string, childName?: string): FollowUpType {
  const text = `${parentName || ''} ${childName || ''}`.toLowerCase();
  if (text.includes('meeting')) return 'meeting';
  if (text.includes('site visit')) return 'site_visit';
  if (text.includes('visit')) return 'property_visit';
  if (text.includes('deal') || text.includes('negotiation')) return 'negotiation';
  return 'call';
}

function preferredArea(raw: string, maps: Awaited<ReturnType<typeof migrateMasters>>) {
  const ids = clean(raw).match(/\d+/g) || [];
  const names = ids.map((id) => maps.areaMap.get(Number(id))?.Name).filter(Boolean).map(clean);
  return names.join(', ') || clean(raw) || undefined;
}

async function migrateLeads(pool: sql.ConnectionPool, users: Awaited<ReturnType<typeof migrateUsers>>, maps: Awaited<ReturnType<typeof migrateMasters>>) {
  const leads = await q<OldLead>(pool, 'SELECT * FROM Tbl_Enquiry ORDER BY Id');
  const oldLeadIdToNew = new Map<number, Id>();

  for (const old of leads) {
    const leadId = `OLD-${old.Id}`;
    const existing = await LeadModel.findOne({ leadId });
    if (existing) {
      oldLeadIdToNew.set(old.Id, existing._id as Id);
      report.leads.skipped += 1;
      continue;
    }

    const assignedTo = users.byOldId.get(old.AssignTo) || users.defaultUserId;
    const createdBy = users.byOldId.get(old.CreatedBy) || users.byOldId.get(old.AssignBy) || users.defaultUserId;
    const createdAt = dateOrNow(old.CreatedOn);
    const status = leadStatus(old.EnquiryStatusId, old.IsClosed);
    const { budgetMin, budgetMax } = budgetFrom(old.BudgetId, maps);
    const mobile = mobile10(old.MobileNo) || mobile10(old.Mobile1) || mobile10(old.Mobile2) || mobile10(old.Mobile3) || `00000${String(old.Id).padStart(5, '0')}`;

    const lead = new LeadModel({
      leadId,
      customerName: clean(old.NameOfClient) || `Legacy Lead ${old.Id}`,
      mobile,
      alternateMobile: [mobile10(old.Mobile1), mobile10(old.Mobile2), mobile10(old.Mobile3)].filter(Boolean).join(', ') || undefined,
      email: clean(old.Email).toLowerCase() || undefined,
      category: leadCategory(old.EnquiryFor),
      propertyType: propertyTypeFromBhk(old.BhkOfficeId, maps),
      propertyConfiguration: propertyConfiguration(old.BhkOfficeId, maps),
      leadSource: (old.SourceId && maps.sourceMap.get(old.SourceId)) || maps.otherSource,
      budgetMin,
      budgetMax,
      preferredArea: preferredArea(old.AreaId, maps),
      priority: priorityFor(status, old.LastRemark),
      status,
      initialRemark: clean(old.Remark) || clean(old.LastRemark) || `Imported from legacy enquiry #${old.Id}`,
      notes: clean(old.LastRemark) ? [{ text: clean(old.LastRemark), createdBy, createdAt }] : [],
      assignedTo,
      assignedAt: createdAt,
      nextFollowUpDate: status === 'closed' ? undefined : old.Nfd || undefined,
      createdBy,
      updatedBy: old.UpdatedOn ? createdBy : undefined,
      createdAt,
      updatedAt: old.UpdatedOn || createdAt,
    });
    await lead.save();

    const assignment = new LeadAssignmentModel({
      leadId: lead._id,
      assignedTo,
      assignedBy: createdBy,
      assignedAt: createdAt,
      isCurrent: true,
      sequence: 1,
      createdAt,
      updatedAt: createdAt,
    });
    await assignment.save();
    lead.currentAssignmentId = assignment._id as Id;
    await lead.save();

    await LeadActivityModel.create({
      leadId: lead._id,
      assignmentId: assignment._id,
      type: 'LEAD_CREATED',
      title: 'Legacy lead imported',
      remark: `Imported from Tbl_Enquiry #${old.Id}`,
      performedBy: createdBy,
      metadata: { legacyTable: 'Tbl_Enquiry', legacyId: old.Id },
      createdAt,
      updatedAt: createdAt,
    });

    oldLeadIdToNew.set(old.Id, lead._id as Id);
    report.leads.inserted += 1;
  }

  return oldLeadIdToNew;
}

function visitFromFollowUp(type: FollowUpType, childName: string): { type: VisitType; status: VisitStatus } | null {
  const text = childName.toLowerCase();
  if (type === 'site_visit') return { type: 'site_visit', status: 'scheduled' };
  if (type === 'property_visit') return { type: 'property_visit', status: text.includes('done') ? 'completed' : 'scheduled' };
  if (type === 'revisit') return { type: 'revisit', status: text.includes('done') ? 'completed' : 'scheduled' };
  return null;
}

async function migrateRemarks(pool: sql.ConnectionPool, users: Awaited<ReturnType<typeof migrateUsers>>, maps: Awaited<ReturnType<typeof migrateMasters>>, oldLeadIdToNew: Map<number, Id>) {
  const remarks = await q<OldRemark>(pool, 'SELECT * FROM Tbl_EnquiryRemarks ORDER BY EnquiryId, CreatedOn, Id');
  const byLead = new Map<number, OldRemark[]>();
  for (const remark of remarks) {
    const list = byLead.get(remark.EnquiryId) || [];
    list.push(remark);
    byLead.set(remark.EnquiryId, list);
  }

  for (const [oldLeadId, list] of byLead.entries()) {
    const leadId = oldLeadIdToNew.get(oldLeadId);
    if (!leadId) continue;
    const existingCount = await LeadFollowUpModel.countDocuments({ leadId });
    if (existingCount >= list.length) {
      report.followUps.skippedLeads += 1;
      continue;
    }

    const lead = await LeadModel.findById(leadId).select('currentAssignmentId').lean();
    for (const old of list) {
      const activity = old.ActivityChildId ? maps.childMap.get(old.ActivityChildId) : undefined;
      const type = inferFollowUpType(activity?.parentName, activity?.name);
      const createdBy = users.byOldId.get(old.CreatedBy) || users.defaultUserId;
      const createdAt = dateOrNow(old.CreatedOn);
      const followUp = await LeadFollowUpModel.create({
        leadId,
        assignmentId: lead?.currentAssignmentId,
        followUpDate: createdAt,
        type,
        parentActivity: activity?.parentId,
        childActivity: activity?.id,
        remark: clean(old.Remark) || `Legacy follow-up #${old.Id}`,
        nextFollowUpDate: old.Nfd || undefined,
        createdBy,
        createdAt,
        updatedAt: createdAt,
      });

      await LeadActivityModel.create({
        leadId,
        assignmentId: lead?.currentAssignmentId,
        type: type === 'property_visit' || type === 'site_visit' ? 'VISIT_SCHEDULED' : 'FOLLOW_UP_ADDED',
        title: `Follow-up: ${activity?.name || type.replace(/_/g, ' ')}`,
        remark: clean(old.Remark),
        performedBy: createdBy,
        metadata: { legacyTable: 'Tbl_EnquiryRemarks', legacyId: old.Id, followUpId: followUp._id },
        createdAt,
        updatedAt: createdAt,
      });

      const visit = visitFromFollowUp(type, activity?.name || '');
      if (visit) {
        await VisitModel.create({
          leadId,
          assignmentId: lead?.currentAssignmentId,
          followUpId: followUp._id,
          type: visit.type,
          scheduledDate: old.Nfd || createdAt,
          status: visit.status,
          remark: clean(old.Remark),
          source: 'follow_up',
          createdBy,
          createdAt,
          updatedAt: createdAt,
        });
        report.visits.inserted += 1;
      }

      report.followUps.inserted += 1;
    }
  }
}

function propertyPurpose(value: number): PropertyPurpose {
  if (value === 1) return 'rent';
  return 'sell';
}

function propertyStatus(value: number | null): PropertyStatus {
  if (value === 1) return 'rented';
  if (value === 2) return 'sold';
  if (value === 4) return 'reserved';
  return 'available';
}

function furnished(value: number | null): FurnishedStatus | undefined {
  if (value === 2) return 'fully';
  if (value === 4) return 'semi';
  if (value === 3) return 'unfurnished';
  return undefined;
}

async function migrateProperties(pool: sql.ConnectionPool, users: Awaited<ReturnType<typeof migrateUsers>>, maps: Awaited<ReturnType<typeof migrateMasters>>) {
  const rows = await q<OldProperty>(pool, 'SELECT * FROM Tbl_Property ORDER BY Id');
  const buildingRows = await q<{ Id: number; Name: string }>(pool, 'SELECT Id, Name FROM Tbl_Buildings');
  const buildingMap = buildLookup(buildingRows);

  for (const old of rows) {
    const propertyCode = `OLDPR-${old.Id}`;
    if (await PropertyModel.findOne({ propertyCode })) {
      report.properties.skipped += 1;
      continue;
    }

    const createdBy = users.byOldId.get(old.CreatedBy) || users.byOldId.get(old.UserId) || users.defaultUserId;
    const area = old.AreaId ? clean(maps.areaMap.get(old.AreaId)?.Name) : '';
    const building = old.BuildingId ? clean(buildingMap.get(old.BuildingId)?.Name) : '';
    const flat = clean([old.Block, old.FlatNumber].filter(Boolean).join('-'));
    const title = clean([building, flat, area].filter(Boolean).join(' ')) || `Legacy Property ${old.Id}`;
    const createdAt = dateOrNow(old.CreatedOn);
    const purpose = propertyPurpose(old.PropertyFor);

    await PropertyModel.create({
      propertyCode,
      title,
      slug: `${slugifyTitle(title)}-${old.Id}`,
      description: clean([
        old.Remark,
        old.OwnerName && `Owner: ${old.OwnerName}`,
        old.Mobile && `Owner mobile: ${old.Mobile}`,
        old.Comission && `Commission: ${old.Comission}`,
        old.KeyStatus && `Key status: ${old.KeyStatus}`,
      ].filter(Boolean).join('\n')),
      purpose,
      propertyType: propertyTypeFromBhk(old.BhkOfficeId, maps),
      status: propertyStatus(old.PropertyStatusId),
      expectedPrice: purpose === 'sell' ? Number(old.PropertyPrice) || undefined : undefined,
      rentAmount: purpose === 'rent' ? Number(old.PropertyPrice) || undefined : undefined,
      city: 'Ahmedabad',
      area,
      landmark: clean(old.Address) || undefined,
      bedrooms: Number(clean(maps.bhkMap.get(old.BhkOfficeId || 0)?.Name).match(/\d+/)?.[0]) || undefined,
      parking: Number(clean(old.Parking).match(/\d+/)?.[0]) || undefined,
      superBuiltUpArea: old.SuperBuiltupArea || old.BuiltupArea || undefined,
      carpetArea: old.CarpetArea || undefined,
      furnishedStatus: furnished(old.FurnitureStatusId),
      amenities: [],
      gallery: [],
      videos: [],
      floorPlans: [],
      publishOnWebsite: false,
      isFeatured: false,
      showPrice: true,
      hideExactLocation: true,
      inquiryCount: 0,
      viewCount: 0,
      createdBy,
      updatedBy: old.UpdatedOn ? createdBy : undefined,
      createdAt,
      updatedAt: old.UpdatedOn || createdAt,
    });
    report.properties.inserted += 1;
  }
}

async function migrateLogs(pool: sql.ConnectionPool, users: Awaited<ReturnType<typeof migrateUsers>>) {
  if (process.env.MIGRATE_LEGACY_LOGS === 'false') return;
  const already = await ActivityLogModel.countDocuments({ description: /^\[LegacyLog#/ });
  if (already > 0) {
    report.logs.skipped = already;
    return;
  }

  const logs = await q<OldLog>(pool, 'SELECT * FROM Tbl_LogData ORDER BY Id');
  const batch: Record<string, unknown>[] = [];
  for (const old of logs) {
    batch.push({
      user: users.byOldId.get(old.CreatedBy) || users.defaultUserId,
      action: `LEGACY_MODULE_${old.Module}`,
      module: clean(old.PageName) || `LEGACY_${old.Module}`,
      description: `[LegacyLog#${old.Id}] ${clean(old.Description)}`,
      ipAddress: clean(old.IpAddress) || undefined,
      createdAt: dateOrNow(old.CreatedOn),
      updatedAt: dateOrNow(old.CreatedOn),
    });
    if (batch.length >= 1000) {
      await ActivityLogModel.insertMany(batch, { ordered: false });
      report.logs.inserted += batch.length;
      batch.length = 0;
    }
  }
  if (batch.length > 0) {
    await ActivityLogModel.insertMany(batch, { ordered: false });
    report.logs.inserted += batch.length;
  }
}

async function writeReport() {
  const dir = path.resolve(process.cwd(), '..', '.codex-run', 'sql-migration');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'migration-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

async function run() {
  console.log('Connecting to MongoDB and seeding required masters...');
  await connectDatabase();
  await seedAdmin();
  await seedMasters();

  console.log('Connecting to SQL Server backup database...');
  const pool = await sql.connect(sqlConfig);
  try {
    const users = await migrateUsers(pool);
    const masters = await migrateMasters(pool);
    const leadMap = await migrateLeads(pool, users, masters);
    await migrateRemarks(pool, users, masters, leadMap);
    await migrateProperties(pool, users, masters);
    await migrateLogs(pool, users);
    await writeReport();
  } finally {
    await pool.close();
    await disconnectDatabase();
  }
}

run().catch(async (error) => {
  console.error('Legacy SQL migration failed:', error);
  warn(error instanceof Error ? error.message : String(error));
  await writeReport().catch(() => undefined);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
