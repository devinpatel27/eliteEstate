import mongoose, { Schema, Document, Types } from 'mongoose';
import { FOLLOW_UP_TYPES, FollowUpType, LEAD_PRIORITIES, LeadPriority } from '../constants/lead.constants';

export interface ILeadFollowUp extends Document {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  followUpDate: Date;
  followUpTime?: string;
  type: FollowUpType;
  priority?: LeadPriority;
  parentActivity?: Types.ObjectId;
  childActivity?: Types.ObjectId;
  remark?: string;
  nextFollowUpDate?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadFollowUpSchema = new Schema<ILeadFollowUp>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'LeadAssignment', required: true, index: true },
    followUpDate: { type: Date, required: true },
    followUpTime: { type: String, trim: true },
    type: { type: String, enum: FOLLOW_UP_TYPES, required: true },
    priority: { type: String, enum: LEAD_PRIORITIES },
    parentActivity: { type: Schema.Types.ObjectId, ref: 'FollowUpActivity' },
    childActivity: { type: Schema.Types.ObjectId, ref: 'FollowUpActivity' },
    remark: { type: String, trim: true },
    nextFollowUpDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

leadFollowUpSchema.index({ leadId: 1, assignmentId: 1 });

export const LeadFollowUpModel = mongoose.model<ILeadFollowUp>('LeadFollowUp', leadFollowUpSchema);
