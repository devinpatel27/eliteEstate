import { Types } from 'mongoose';
import { PropertyTypeModel } from '../models/PropertyType.model';
import { PropertyAmenityModel } from '../models/PropertyAmenity.model';
import { LeadSourceModel } from '../models/LeadSource.model';
import { FollowUpActivityModel } from '../models/FollowUpActivity.model';
import { SystemSettingsModel } from '../models/SystemSettings.model';
import { LeadModel } from '../models/Lead.model';
import { PropertyModel } from '../models/Property.model';
import { isValidObjectId } from '../utils/objectId.utils';

const PROPERTY_TYPE_SLUG_ALIASES: Record<string, string> = {
  residential: 'flat',
  commercial: 'commercial_office',
  commercial_office: 'commercial_office',
  apartment: 'apartment',
};

const PROPERTY_TYPES = [
  'Apartment',
  'Flat',
  'Villa',
  'House',
  'Bungalow',
  'Plot',
  'Farm House',
  'Office',
  'Shop',
  'Warehouse',
  'Industrial Property',
];

const PROPERTY_AMENITIES = [
  'Lift',
  'Security',
  'Garden',
  'Gym',
  'Swimming Pool',
  'Club House',
  'Power Backup',
  'CCTV',
  "Children's Play Area",
  'Visitor Parking',
];

const LEAD_SOURCES = [
  'Website Property Inquiry',
  'Website Contact Form',
  'Website',
  'Facebook',
  'Instagram',
  'Google Ads',
  'WhatsApp',
  'JustDial',
  'MagicBricks',
  '99acres',
  'Referral',
  'Walk-In',
  'Existing Customer',
  'Other',
];

const FOLLOW_UP_ACTIVITIES = [
  {
    name: 'Phone Call',
    children: [
      'Already Purchased',
      'CNR / CC / Switched off',
      'Call back request',
      'Closed',
      'Deal Related Discussion',
      'Details send',
      'Non Service Area',
      'Not interested',
      'On Hold',
      'Option suggested',
      'Repeat Inquiry',
      'Requirement Understand',
      'Site Visit schedule',
    ],
  },
  {
    name: 'Visit',
    children: ['Visit Done', 'Site Visit schedule', 'Repeat Inquiry'],
  },
  {
    name: 'Meeting',
    children: ['Meeting Done', 'Deal Related Discussion', 'Requirement Understand'],
  },
  {
    name: 'Deal',
    children: ['Deal Done', 'Closed', 'Negotiation', 'On Hold'],
  },
];

const toSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const resolvePropertyTypeId = async (raw: string): Promise<Types.ObjectId | null> => {
  const slug = PROPERTY_TYPE_SLUG_ALIASES[raw.toLowerCase()] || raw.toLowerCase();
  const propertyType = await PropertyTypeModel.findOne({
    $or: [{ slug }, { name: new RegExp(`^${raw.replace(/_/g, ' ')}$`, 'i') }],
  });
  return propertyType?._id ?? null;
};

const migratePropertyReferences = async (): Promise<void> => {
  const properties = await PropertyModel.find({ deletedAt: null })
    .select('propertyType amenities')
    .lean();
  let fixed = 0;

  for (const property of properties) {
    const updates: Record<string, unknown> = {};

    const propertyTypeValue = String(property.propertyType ?? '');
    if (propertyTypeValue && !isValidObjectId(propertyTypeValue)) {
      const propertyTypeId = await resolvePropertyTypeId(propertyTypeValue);
      if (propertyTypeId) updates.propertyType = propertyTypeId;
    }

    if (Array.isArray(property.amenities) && property.amenities.length > 0) {
      const amenityIds: Types.ObjectId[] = [];
      let needsAmenityFix = false;

      for (const amenity of property.amenities) {
        const amenityValue = String(amenity ?? '');
        if (!amenityValue) continue;
        if (isValidObjectId(amenityValue)) {
          amenityIds.push(new Types.ObjectId(amenityValue));
          continue;
        }
        needsAmenityFix = true;
        const amenityDoc = await PropertyAmenityModel.findOne({
          $or: [{ slug: amenityValue }, { name: new RegExp(`^${amenityValue}$`, 'i') }],
        });
        if (amenityDoc) amenityIds.push(amenityDoc._id);
      }

      if (needsAmenityFix) updates.amenities = amenityIds;
    }

    if (Object.keys(updates).length > 0) {
      await PropertyModel.updateOne({ _id: property._id }, { $set: updates });
      fixed += 1;
    }
  }

  if (fixed > 0) {
    console.log(`✅ Migrated property references (${fixed})`);
  }
};

const migrateLeadReferences = async (): Promise<void> => {
  const leads = await LeadModel.find({ deletedAt: null }).select('propertyType leadSource').lean();
  let fixed = 0;

  for (const lead of leads) {
    const updates: Record<string, Types.ObjectId> = {};

    const propertyTypeValue = String(lead.propertyType ?? '');
    if (propertyTypeValue && !isValidObjectId(propertyTypeValue)) {
      const propertyType = await PropertyTypeModel.findOne({
        $or: [{ slug: propertyTypeValue }, { name: new RegExp(`^${propertyTypeValue}$`, 'i') }],
      });
      if (propertyType) updates.propertyType = propertyType._id;
    }

    const leadSourceValue = String(lead.leadSource ?? '');
    if (leadSourceValue && !isValidObjectId(leadSourceValue)) {
      const leadSource = await LeadSourceModel.findOne({
        $or: [{ slug: leadSourceValue }, { name: new RegExp(`^${leadSourceValue}$`, 'i') }],
      });
      if (leadSource) updates.leadSource = leadSource._id;
    }

    if (Object.keys(updates).length > 0) {
      await LeadModel.updateOne({ _id: lead._id }, { $set: updates });
      fixed += 1;
    }
  }

  if (fixed > 0) {
    console.log(`✅ Migrated lead references (${fixed})`);
  }
};

const STATUS_ALIASES: Record<string, string> = {
  followup: 'follow_up',
  'follow-up': 'follow_up',
  follow_up: 'follow_up',
};

const PRIORITY_ALIASES: Record<string, string> = {
  medium: 'warm',
  low: 'cold',
  high: 'hot',
};

const migrateLegacyLeadData = async (): Promise<void> => {
  const leads = await LeadModel.find({ deletedAt: null })
    .select('status priority leadId')
    .lean();
  let fixed = 0;

  for (const lead of leads) {
    const updates: Record<string, string> = {};

    const statusKey = String(lead.status ?? '').toLowerCase().replace(/\s+/g, '_');
    if (statusKey && STATUS_ALIASES[statusKey] && STATUS_ALIASES[statusKey] !== lead.status) {
      updates.status = STATUS_ALIASES[statusKey];
    }

    const priorityKey = String(lead.priority ?? '').toLowerCase();
    if (priorityKey && PRIORITY_ALIASES[priorityKey] && PRIORITY_ALIASES[priorityKey] !== lead.priority) {
      updates.priority = PRIORITY_ALIASES[priorityKey];
    }

    if (Object.keys(updates).length > 0) {
      await LeadModel.updateOne({ _id: lead._id }, { $set: updates });
      fixed += 1;
    }
  }

  if (fixed > 0) {
    console.log(`✅ Migrated legacy lead status/priority (${fixed})`);
  }
};

export const seedMasters = async (): Promise<void> => {
  try {
    for (let i = 0; i < PROPERTY_TYPES.length; i++) {
      const name = PROPERTY_TYPES[i];
      const slug = toSlug(name);
      await PropertyTypeModel.findOneAndUpdate(
        { slug },
        { name, slug, status: 'active', sortOrder: i + 1 },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Property types seeded (${PROPERTY_TYPES.length})`);

    for (let i = 0; i < LEAD_SOURCES.length; i++) {
      const name = LEAD_SOURCES[i];
      const slug = toSlug(name);
      await LeadSourceModel.findOneAndUpdate(
        { slug },
        { name, slug, status: 'active', sortOrder: i + 1 },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Lead sources seeded (${LEAD_SOURCES.length})`);

    for (let i = 0; i < FOLLOW_UP_ACTIVITIES.length; i++) {
      const parent = FOLLOW_UP_ACTIVITIES[i];
      const slug = toSlug(parent.name);
      const parentDoc = await FollowUpActivityModel.findOneAndUpdate(
        { slug, parent: { $exists: false } },
        { name: parent.name, slug, status: 'active', sortOrder: i + 1 },
        { upsert: true, new: true }
      );

      for (let j = 0; j < parent.children.length; j++) {
        const name = parent.children[j];
        const childSlug = toSlug(name);
        await FollowUpActivityModel.findOneAndUpdate(
          { slug: childSlug, parent: parentDoc._id },
          { name, slug: childSlug, parent: parentDoc._id, status: 'active', sortOrder: j + 1 },
          { upsert: true, new: true }
        );
      }
    }
    console.log(`✅ Follow-up activities seeded (${FOLLOW_UP_ACTIVITIES.length})`);

    for (let i = 0; i < PROPERTY_AMENITIES.length; i++) {
      const name = PROPERTY_AMENITIES[i];
      const slug = toSlug(name);
      await PropertyAmenityModel.findOneAndUpdate(
        { slug },
        { name, slug, status: 'active', sortOrder: i + 1 },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Property amenities seeded (${PROPERTY_AMENITIES.length})`);

    await SystemSettingsModel.findOneAndUpdate(
      { key: 'default' },
      {
        $setOnInsert: {
          leadAssignment: {
            mode: 'manual',
            roundRobinEmployeeIds: [],
            lastAssignedIndex: 0,
          },
        },
      },
      { upsert: true, new: true }
    );
    console.log('✅ System settings initialized');

    await migratePropertyReferences();
    await migrateLeadReferences();
    await migrateLegacyLeadData();
  } catch (error) {
    console.error('❌ Failed to seed masters:', error);
    throw error;
  }
};
