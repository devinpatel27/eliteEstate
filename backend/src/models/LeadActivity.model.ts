import mongoose, { Schema, Document, Types } from 'mongoose';
import { LEAD_ACTIVITY_TYPES, LeadActivityType } from '../constants/lead.constants';

export interface ILeadActivity extends Document {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  assignmentId?: Types.ObjectId;
  type: LeadActivityType;
  title: string;
  remark?: string;
  performedBy: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const leadActivitySchema = new Schema<ILeadActivity>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'LeadAssignment', index: true },
    type: { type: String, enum: LEAD_ACTIVITY_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    remark: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

leadActivitySchema.index({ leadId: 1, createdAt: -1 });
leadActivitySchema.index({ leadId: 1, assignmentId: 1 });

export const LeadActivityModel = mongoose.model<ILeadActivity>('LeadActivity', leadActivitySchema);
