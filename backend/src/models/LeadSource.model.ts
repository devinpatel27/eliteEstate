import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadSource extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const leadSourceSchema = new Schema<ILeadSource>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leadSourceSchema.index({ status: 1, sortOrder: 1 });

export const LeadSourceModel = mongoose.model<ILeadSource>('LeadSource', leadSourceSchema);
