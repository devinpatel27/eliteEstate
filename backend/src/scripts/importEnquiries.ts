/**
 * One-off utility to import legacy "Enquiry Export" (.xls / MS-Office HTML table)
 * data into the CRM as Leads, for local/staging testing purposes.
 *
 * Usage:
 *   npm run import:enquiries -- "C:\path\to\Enquiry_Export.xls"
 *   (falls back to the Downloads path used during development if omitted)
 *
 * Notes:
 *  - Missing fields (email, budget, follow-up date, etc.) are backfilled with
 *    sensible dummy/derived values so every row produces a valid Lead.
 *  - Re-running is safe: rows already imported (matched by mobile + name) are skipped.
 *  - Lead Source / Property Type values not already present in masters are created.
 *  - All rows are assigned to the employee named in the "Assign To" column
 *    (created automatically as a dummy employee if it does not exist).
 */
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import mongoose from 'mongoose';

// Some local Windows network setups fail Node's SRV DNS lookups against the
// system resolver (especially IPv6-only resolvers) even though the OS itself
// resolves them fine. Prefer public resolvers for this standalone script only.
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { connectDatabase, disconnectDatabase } from '../config/database';
import { env } from '../config/env';
import { UserModel } from '../models/User.model';
import { RoleModel } from '../models/Role.model';
import { LeadModel } from '../models/Lead.model';
import { LeadAssignmentModel } from '../models/LeadAssignment.model';
import { LeadSourceModel } from '../models/LeadSource.model';
import { PropertyTypeModel } from '../models/PropertyType.model';
import { hashPassword } from '../utils/bcrypt.utils';
import { LeadCategory, LeadPriority, LeadStatus } from '../constants/lead.constants';

const DEFAULT_FILE_PATH = 'C:\\Users\\BAPS\\Downloads\\1784465450514_Enquiry_Export.xls';

interface EnquiryRow {
  clientName: string;
  mobile: string;
  email: string;
  enquiryFor: string;
  sourceName: string;
  segment: string;
  budget: string;
  remark: string;
  lastRemark: string;
  assignTo: string;
  nfd: string;
  createdOn: string;
}

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const cleanCell = (raw: string): string =>
  decodeEntities(raw.replace(/<!--\s*-->/g, ' ').replace(/\s+/g, ' ')).trim();

const parseDdMmYyyy = (raw: string): Date | undefined => {
  const match = raw.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 10, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseBudget = (raw: string): { budgetMin?: number; budgetMax?: number } => {
  if (!raw) return {};
  const clean = raw.toLowerCase().replace(/\s+/g, '');
  const parts = clean.split('-');
  if (parts.length !== 2) return {};

  const parseOne = (part: string): { value: number; unit: string | null } | null => {
    const m = part.match(/^([\d.]+)(cr|crore|l|lac|lakh)?$/);
    if (!m) return null;
    return { value: parseFloat(m[1]), unit: m[2] || null };
  };

  const p1 = parseOne(parts[0]);
  const p2 = parseOne(parts[1]);
  if (!p1 || !p2) return {};

  let unit1 = p1.unit;
  let unit2 = p2.unit;
  if (!unit1 && !unit2) {
    unit1 = unit2 = 'l';
  } else if (!unit1 && unit2) {
    unit1 = unit2 === 'cr' ? 'l' : unit2;
  } else if (unit1 && !unit2) {
    unit2 = unit1;
  }

  const multiplier = (u: string | null) => (u === 'cr' || u === 'crore' ? 10000000 : 100000);
  const min = Math.round(p1.value * multiplier(unit1));
  const max = Math.round(p2.value * multiplier(unit2));
  return { budgetMin: Math.min(min, max), budgetMax: Math.max(min, max) };
};

const resolveStatus = (lastRemark: string): LeadStatus => {
  const r = lastRemark.toLowerCase();
  if (
    /purchase kari lidhu|lai lidhu|lailidhu|invest kari|purchase kari|brokar/.test(r)
  ) {
    return 'closed';
  }
  if (/not interested|no requirement/.test(r)) return 'closed';
  if (/postpone/.test(r)) return 'hold';
  if (/call.*(not|nor).*receiv/.test(r)) return 'open';
  if (/\bclosed\b/.test(r)) return 'closed';
  return 'open';
};

const resolvePriority = (status: LeadStatus, index: number): LeadPriority => {
  if (status === 'closed') return 'cold';
  const cycle: LeadPriority[] = ['warm', 'hot', 'cold'];
  return cycle[index % cycle.length];
};

const resolveCategory = (raw: string): LeadCategory => {
  const v = raw.trim().toLowerCase();
  if (v.startsWith('sell')) return 'sell_property';
  if (v.startsWith('rent')) return 'rent_property';
  return 'buy_property';
};

const slugifyEmailName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('.') || 'lead';

const parseXlsFile = (filePath: string): EnquiryRow[] => {
  const html = fs.readFileSync(filePath, 'utf-8');
  const rowMatches = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const rows: EnquiryRow[] = [];

  for (let i = 1; i < rowMatches.length; i++) {
    const cellMatches = [...rowMatches[i][1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)];
    if (cellMatches.length < 21) continue;
    const cells = cellMatches.map((m) => cleanCell(m[1]));
    rows.push({
      clientName: cells[0],
      mobile: cells[1],
      email: cells[2],
      enquiryFor: cells[3],
      sourceName: cells[4],
      segment: cells[6],
      budget: cells[9],
      remark: cells[11],
      lastRemark: cells[12],
      assignTo: cells[13],
      nfd: cells[15],
      createdOn: cells[20],
    });
  }

  return rows;
};

async function ensureLeadSource(name: string, sortOrder: number) {
  const slug = toSlug(name);
  return LeadSourceModel.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, status: 'active', sortOrder } },
    { upsert: true, new: true }
  );
}

async function ensurePropertyType(name: string, sortOrder: number) {
  const slug = toSlug(name);
  return PropertyTypeModel.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, status: 'active', sortOrder } },
    { upsert: true, new: true }
  );
}

async function ensureImportEmployee(createdBy: mongoose.Types.ObjectId, rawName: string) {
  const name = rawName.trim() || 'Import Employee';
  const existing = await UserModel.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existing) return existing;

  const employeeRole = await RoleModel.findOne({ roleName: 'employee', isSystem: true });
  if (!employeeRole) {
    throw new Error('Employee role not found. Run `npm run seed` before importing.');
  }

  const employeeCount = await UserModel.countDocuments();
  const employeeId = `EMPIMP${String(employeeCount + 1).padStart(3, '0')}`;
  const emailSlug = slugifyEmailName(name);
  let email = `${emailSlug}@eliteestate.com`;
  let suffix = 1;
  while (await UserModel.findOne({ email })) {
    email = `${emailSlug}${suffix}@eliteestate.com`;
    suffix += 1;
  }

  const password = await hashPassword('Employee@123');

  const user = await UserModel.create({
    employeeId,
    name,
    email,
    mobile: '9999900001',
    password,
    role: employeeRole._id,
    status: 'active',
    joiningDate: new Date(),
    createdBy,
  });

  console.log(`   👤 Created dummy employee "${name}" <${email}> (password: Employee@123)`);
  return user;
}

async function getNextLeadNumber(): Promise<number> {
  const leads = await LeadModel.find({ leadId: /^LD\d+$/ }).select('leadId').lean();
  let max = 0;
  for (const lead of leads) {
    const match = lead.leadId.match(/^LD(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max + 1;
}

async function run() {
  const filePath = process.argv[2] || DEFAULT_FILE_PATH;

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.error('   Pass the path explicitly: npm run import:enquiries -- "<path-to-file>"');
    process.exit(1);
  }

  await connectDatabase();

  const masterAdmin = await UserModel.findOne({ email: env.ADMIN_EMAIL });
  if (!masterAdmin) {
    throw new Error('Master admin not found. Run `npm run seed` before importing.');
  }

  const rows = parseXlsFile(filePath);
  console.log(`📄 Parsed ${rows.length} enquiry rows from ${path.basename(filePath)}`);

  const leadSourceCache = new Map<string, mongoose.Types.ObjectId>();
  const propertyTypeCache = new Map<string, mongoose.Types.ObjectId>();
  const employeeCache = new Map<string, mongoose.Types.ObjectId>();

  let nextLeadNumber = await getNextLeadNumber();
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mobile = row.mobile.replace(/\D/g, '').slice(-10);

    if (!mobile || mobile.length < 10) {
      skipped += 1;
      continue;
    }

    const customerName = row.clientName || `Import Lead ${i + 1}`;

    const existingLead = await LeadModel.findOne({ mobile, customerName });
    if (existingLead) {
      skipped += 1;
      continue;
    }

    const sourceName = row.sourceName || 'Other';
    const sourceKey = sourceName.toLowerCase();
    let leadSourceId = leadSourceCache.get(sourceKey);
    if (!leadSourceId) {
      const doc = await ensureLeadSource(sourceName, 500 + leadSourceCache.size);
      leadSourceId = doc._id as mongoose.Types.ObjectId;
      leadSourceCache.set(sourceKey, leadSourceId);
    }

    const segmentName = row.segment || 'Flat';
    const segmentKey = segmentName.toLowerCase();
    let propertyTypeId = propertyTypeCache.get(segmentKey);
    if (!propertyTypeId) {
      const doc = await ensurePropertyType(segmentName, 500 + propertyTypeCache.size);
      propertyTypeId = doc._id as mongoose.Types.ObjectId;
      propertyTypeCache.set(segmentKey, propertyTypeId);
    }

    const assignToName = row.assignTo || 'Bipin Jadav';
    const assignKey = assignToName.toLowerCase();
    let employeeId = employeeCache.get(assignKey);
    if (!employeeId) {
      const employee = await ensureImportEmployee(
        masterAdmin._id as mongoose.Types.ObjectId,
        assignToName
      );
      employeeId = employee._id as mongoose.Types.ObjectId;
      employeeCache.set(assignKey, employeeId);
    }

    const email = row.email || `${slugifyEmailName(customerName)}.${i}@example-lead.com`;
    const { budgetMin, budgetMax } = parseBudget(row.budget);
    const status = resolveStatus(row.lastRemark);
    const priority = resolvePriority(status, i);
    const category = resolveCategory(row.enquiryFor);
    const createdAt = parseDdMmYyyy(row.createdOn) || new Date();
    const isClosed = status === 'closed';
    const nextFollowUpDate = isClosed ? undefined : parseDdMmYyyy(row.nfd);

    const leadIdStr = `LD${String(nextLeadNumber).padStart(4, '0')}`;
    nextLeadNumber += 1;

    const lead = new LeadModel({
      leadId: leadIdStr,
      customerName,
      mobile,
      email,
      category,
      propertyType: propertyTypeId,
      leadSource: leadSourceId,
      budgetMin,
      budgetMax,
      preferredArea: row.remark || undefined,
      priority,
      status,
      initialRemark: row.lastRemark || 'Imported from legacy enquiry export.',
      notes: row.lastRemark
        ? [{ text: row.lastRemark, createdBy: employeeId, createdAt }]
        : [],
      assignedTo: employeeId,
      assignedAt: createdAt,
      nextFollowUpDate,
      createdBy: masterAdmin._id,
    });
    lead.createdAt = createdAt;
    lead.updatedAt = createdAt;
    await lead.save();

    const assignment = new LeadAssignmentModel({
      leadId: lead._id,
      assignedTo: employeeId,
      assignedBy: masterAdmin._id,
      assignedAt: createdAt,
      isCurrent: true,
      sequence: 1,
    });
    assignment.createdAt = createdAt;
    assignment.updatedAt = createdAt;
    await assignment.save();

    lead.currentAssignmentId = assignment._id as mongoose.Types.ObjectId;
    await lead.save();

    inserted += 1;
  }

  console.log(`✅ Import complete. Inserted: ${inserted}, Skipped (duplicate/invalid): ${skipped}`);

  await disconnectDatabase();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('❌ Import failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
