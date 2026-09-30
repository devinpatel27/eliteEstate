import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyAmenity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const propertyAmenitySchema = new Schema<IPropertyAmenity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

propertyAmenitySchema.index({ status: 1, sortOrder: 1 });

export const PropertyAmenityModel = mongoose.model<IPropertyAmenity>(
  'PropertyAmenity',
  propertyAmenitySchema
);
