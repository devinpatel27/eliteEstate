import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFollowUpActivity extends Document {
  name: string;
  slug: string;
  parent?: Types.ObjectId;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const followUpActivitySchema = new Schema<IFollowUpActivity>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    parent: { type: Schema.Types.ObjectId, ref: 'FollowUpActivity' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

followUpActivitySchema.index({ parent: 1, status: 1, sortOrder: 1 });
followUpActivitySchema.index({ parent: 1, slug: 1 }, { unique: true });

export const FollowUpActivityModel = mongoose.model<IFollowUpActivity>('FollowUpActivity', followUpActivitySchema);
