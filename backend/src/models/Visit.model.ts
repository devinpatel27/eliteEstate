import { Schema, model, Document, Types } from 'mongoose';
import {
  VISIT_TYPES,
  VISIT_STATUSES,
  VISIT_SOURCES,
  VisitType,
  VisitStatus,
  VisitSource,
} from '../constants/visit.constants';

export interface IVisit extends Document {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  assignmentId?: Types.ObjectId;
  followUpId?: Types.ObjectId;
  type: VisitType;
  scheduledDate: Date;
  scheduledTime?: string;
  status: VisitStatus;
  remark?: string;
  source: VisitSource;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const visitSchema = new Schema<IVisit>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'LeadAssignment', index: true },
    followUpId: { type: Schema.Types.ObjectId, ref: 'LeadFollowUp' },
    type: { type: String, enum: VISIT_TYPES, required: true },
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTime: { type: String, trim: true },
    status: { type: String, enum: VISIT_STATUSES, default: 'scheduled', index: true },
    remark: { type: String, trim: true },
    source: { type: String, enum: VISIT_SOURCES, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

visitSchema.index({ leadId: 1, scheduledDate: -1 });

export const VisitModel = model<IVisit>('Visit', visitSchema);
