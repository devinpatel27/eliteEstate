import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPropertyInquiry extends Document {
  propertyId: Types.ObjectId;
  name: string;
  mobile: string;
  email?: string;
  message?: string;
  leadId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const propertyInquirySchema = new Schema<IPropertyInquiry>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    message: { type: String, trim: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  },
  { timestamps: true }
);

export const PropertyInquiryModel = mongoose.model<IPropertyInquiry>(
  'PropertyInquiry',
  propertyInquirySchema
);
