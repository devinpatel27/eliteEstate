import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  LEAD_CATEGORIES,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  LeadCategory,
  LeadPriority,
  LeadStatus,
} from '../constants/lead.constants';

export interface ILead extends Document {
  _id: Types.ObjectId;
  leadId: string;
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  city?: string;
  address?: string;
  category: LeadCategory;
  propertyType: Types.ObjectId;
  propertyConfiguration?: string;
  leadSource: Types.ObjectId;
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  priority: LeadPriority;
  status: LeadStatus;
  initialRemark?: string;
  notes: { text: string; createdBy: Types.ObjectId; createdAt: Date }[];
  assignedTo?: Types.ObjectId;
  currentAssignmentId?: Types.ObjectId;
  assignedAt?: Date;
  sharePreviousRemarks?: boolean;
  remarksRestrictedAt?: Date;
  nextFollowUpDate?: Date;
  propertyId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const leadSchema = new Schema<ILead>(
  {
    leadId: { type: String, required: true, unique: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    alternateMobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true },
    address: { type: String, trim: true },
    category: { type: String, enum: LEAD_CATEGORIES, required: true },
    propertyType: { type: Schema.Types.ObjectId, ref: 'PropertyType', required: true },
    propertyConfiguration: { type: String, trim: true },
    leadSource: { type: Schema.Types.ObjectId, ref: 'LeadSource', required: true },
    budgetMin: { type: Number, min: 0 },
    budgetMax: { type: Number, min: 0 },
    preferredArea: { type: String, trim: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'warm' },
    status: { type: String, enum: LEAD_STATUSES, default: 'open' },
    initialRemark: { type: String, trim: true },
    notes: { type: [noteSchema], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    currentAssignmentId: { type: Schema.Types.ObjectId, ref: 'LeadAssignment' },
    assignedAt: { type: Date },
    sharePreviousRemarks: { type: Boolean, default: false },
    remarksRestrictedAt: { type: Date },
    nextFollowUpDate: { type: Date },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ nextFollowUpDate: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ deletedAt: 1 });
leadSchema.index({ mobile: 1, status: 1 });

export const LeadModel = mongoose.model<ILead>('Lead', leadSchema);
