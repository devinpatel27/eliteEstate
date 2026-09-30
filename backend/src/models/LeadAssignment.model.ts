import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeadAssignment extends Document {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  assignedTo: Types.ObjectId;
  assignedBy: Types.ObjectId;
  assignedAt: Date;
  transferredAt?: Date;
  transferRemark?: string;
  isCurrent: boolean;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const leadAssignmentSchema = new Schema<ILeadAssignment>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, required: true, default: Date.now },
    transferredAt: { type: Date },
    transferRemark: { type: String, trim: true },
    isCurrent: { type: Boolean, default: true, index: true },
    sequence: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

leadAssignmentSchema.index({ leadId: 1, isCurrent: 1 });
leadAssignmentSchema.index({ assignedTo: 1 });

export const LeadAssignmentModel = mongoose.model<ILeadAssignment>(
  'LeadAssignment',
  leadAssignmentSchema
);
