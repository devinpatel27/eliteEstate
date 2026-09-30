import mongoose, { Schema, Document, Types } from 'mongoose';

export type LeadAssignmentMode = 'manual' | 'round_robin';

export interface ISystemSettings extends Document {
  key: string;
  leadAssignment: {
    mode: LeadAssignmentMode;
    roundRobinEmployeeIds: Types.ObjectId[];
    lastAssignedIndex: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    leadAssignment: {
      mode: { type: String, enum: ['manual', 'round_robin'], default: 'manual' },
      roundRobinEmployeeIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      lastAssignedIndex: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const SystemSettingsModel = mongoose.model<ISystemSettings>(
  'SystemSettings',
  systemSettingsSchema
);
