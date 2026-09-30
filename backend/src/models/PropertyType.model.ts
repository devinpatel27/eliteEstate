import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyType extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const propertyTypeSchema = new Schema<IPropertyType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

propertyTypeSchema.index({ status: 1, sortOrder: 1 });

export const PropertyTypeModel = mongoose.model<IPropertyType>('PropertyType', propertyTypeSchema);
