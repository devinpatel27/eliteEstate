import { Types } from 'mongoose';
import { propertyRepository } from '../features/properties/property.repository';
import { leadRepository } from '../features/leads/lead.repository';
import { SystemSettingsModel } from '../models/SystemSettings.model';
import { LeadSourceModel } from '../models/LeadSource.model';
import { UserModel } from '../models/User.model';
import { PropertyTypeModel } from '../models/PropertyType.model';
import { PropertyModel } from '../models/Property.model';
import { generateLeadId } from '../utils/leadId.utils';
import { normalizeMobile, isValidMobile } from '../utils/mobile.utils';
import { AppError } from '../middleware/error.middleware';
import { LeadCategory } from '../constants/lead.constants';
import { PropertyPurpose } from '../constants/property.constants';
import { env } from '../config/env';

const purposeToCategory = (purpose: PropertyPurpose): LeadCategory => {
  if (purpose === 'sell') return 'sell_property';
  if (purpose === 'rent') return 'rent_property';
  return 'buy_property';
};

const getSystemUserId = async (): Promise<Types.ObjectId> => {
  const admin = await UserModel.findOne({ email: env.ADMIN_EMAIL }).select('_id');
  if (!admin) throw new AppError('System user not configured', 500);
  return admin._id;
};

const getLeadSourceId = async (slug: string): Promise<Types.ObjectId> => {
  const source = await LeadSourceModel.findOne({ slug }).select('_id');
  if (!source) throw new AppError(`Lead source "${slug}" not found`, 500);
  return source._id;
};

const assignRoundRobin = async (
  leadId: Types.ObjectId,
  systemUserId: Types.ObjectId
): Promise<string | undefined> => {
  const settings = await SystemSettingsModel.findOne({ key: 'default' });
  if (!settings || settings.leadAssignment.mode !== 'round_robin') return undefined;

  const employeeIds = settings.leadAssignment.roundRobinEmployeeIds;
  if (!employeeIds.length) return undefined;

  const index = settings.leadAssignment.lastAssignedIndex % employeeIds.length;
  const assigneeId = employeeIds[index];

  const sequence = await leadRepository.getNextAssignmentSequence(leadId.toString());
  const assignment = await leadRepository.createAssignment({
    leadId,
    assignedTo: assigneeId,
    assignedBy: systemUserId,
    sequence,
  });

  await leadRepository.update(leadId.toString(), {
    assignedTo: assigneeId,
    currentAssignmentId: assignment._id,
    assignedAt: new Date(),
  });

  await SystemSettingsModel.updateOne(
    { key: 'default' },
    { $set: { 'leadAssignment.lastAssignedIndex': index + 1 } }
  );

  return assigneeId.toString();
};

export const leadAutoAssignService = {
  createFromPropertyInquiry: async (params: {
    propertyId: string;
    name: string;
    mobile: string;
    email?: string;
    message?: string;
    propertyTitle?: string;
  }) => {
    if (!isValidMobile(params.mobile)) throw new AppError('Invalid mobile number', 400);

    const property = await PropertyModel.findOne({
      _id: params.propertyId,
      deletedAt: null,
      publishOnWebsite: true,
    })
      .select('title purpose propertyType city area expectedPrice rentAmount')
      .lean();

    if (!property) throw new AppError('Property not found', 404);

    const normalized = normalizeMobile(params.mobile);
    const systemUserId = await getSystemUserId();
    const leadSourceId = await getLeadSourceId('website_property_inquiry');

    const activeLead = await leadRepository.findActiveByMobile(normalized);
    let leadId: Types.ObjectId;

    if (activeLead) {
      leadId = activeLead._id as Types.ObjectId;
      await leadRepository.update(leadId.toString(), {
        propertyId: new Types.ObjectId(params.propertyId),
        updatedBy: systemUserId,
      });
    } else {
      const leadIdStr = await generateLeadId();
      const remark = [
        params.message,
        `Property: ${params.propertyTitle || property.title}`,
      ]
        .filter(Boolean)
        .join('\n');

      const lead = await leadRepository.create({
        leadId: leadIdStr,
        customerName: params.name,
        mobile: normalized,
        email: params.email?.toLowerCase(),
        city: property.city,
        preferredArea: property.area,
        category: purposeToCategory(property.purpose as PropertyPurpose),
        propertyType: property.propertyType as Types.ObjectId,
        leadSource: leadSourceId,
        budgetMin: property.expectedPrice || property.rentAmount,
        propertyId: new Types.ObjectId(params.propertyId),
        priority: 'warm',
        status: 'open',
        initialRemark: remark,
        createdBy: systemUserId,
      });

      leadId = lead._id;

      await leadRepository.createActivity({
        leadId,
        type: 'LEAD_CREATED',
        title: 'Lead Created',
        remark: 'Created from website property inquiry',
        performedBy: systemUserId,
      });

      await assignRoundRobin(leadId, systemUserId);
    }

    const inquiry = await propertyRepository.createInquiry({
      propertyId: params.propertyId,
      name: params.name,
      mobile: normalized,
      email: params.email,
      message: params.message,
      leadId: leadId.toString(),
    });

    await propertyRepository.incrementInquiryCount(params.propertyId);

    return { inquiry, leadId: leadId.toString() };
  },

  createFromContactForm: async (params: {
    name: string;
    mobile: string;
    email?: string;
    subject: string;
    message: string;
  }) => {
    if (!isValidMobile(params.mobile)) throw new AppError('Invalid mobile number', 400);

    const normalized = normalizeMobile(params.mobile);
    const systemUserId = await getSystemUserId();
    const leadSourceId = await getLeadSourceId('website_contact_form');

    const activeLead = await leadRepository.findActiveByMobile(normalized);
    if (activeLead) {
      return { leadId: activeLead._id.toString(), existing: true };
    }

    const defaultPropertyType = await PropertyTypeModel.findOne({ status: 'active' })
      .sort({ sortOrder: 1 })
      .select('_id');

    const propertyTypeId = defaultPropertyType?._id;
    if (!propertyTypeId) throw new AppError('Property types not configured', 500);

    const leadIdStr = await generateLeadId();
    const remark = `Subject: ${params.subject}\n${params.message}`;

    const lead = await leadRepository.create({
      leadId: leadIdStr,
      customerName: params.name,
      mobile: normalized,
      email: params.email?.toLowerCase(),
      category: 'buy_property',
      propertyType: propertyTypeId,
      leadSource: leadSourceId,
      priority: 'warm',
      status: 'open',
      initialRemark: remark,
      createdBy: systemUserId,
    });

    await leadRepository.createActivity({
      leadId: lead._id,
      type: 'LEAD_CREATED',
      title: 'Lead Created',
      remark: 'Created from website contact form',
      performedBy: systemUserId,
    });

    await assignRoundRobin(lead._id, systemUserId);

    return { leadId: lead._id.toString(), existing: false };
  },
};
