import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  FURNISHED_STATUSES,
  PropertyPurpose,
  PropertyStatus,
  FurnishedStatus,
} from '../constants/property.constants';

export interface PropertyMediaItem {
  path: string;
  thumbPath?: string;
  mediumPath?: string;
  originalName?: string;
}

export interface IProperty extends Document {
  propertyCode: string;
  title: string;
  slug: string;
  description?: string;
  purpose: PropertyPurpose;
  propertyType: Types.ObjectId;
  status: PropertyStatus;
  expectedPrice?: number;
  rentAmount?: number;
  securityDeposit?: number;
  maintenanceCharges?: number;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  publicLocationLabel?: string;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  parking?: number;
  superBuiltUpArea?: number;
  carpetArea?: number;
  furnishedStatus?: FurnishedStatus;
  amenities: Types.ObjectId[];
  featuredImage?: PropertyMediaItem;
  gallery: PropertyMediaItem[];
  videos: { path: string; title?: string }[];
  floorPlans: PropertyMediaItem[];
  metaTitle?: string;
  metaDescription?: string;
  publishOnWebsite: boolean;
  isFeatured: boolean;
  showPrice: boolean;
  hideExactLocation: boolean;
  inquiryCount: number;
  viewCount: number;
  ownerId?: Types.ObjectId;
  dealId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const mediaItemSchema = new Schema(
  {
    path: { type: String, required: true },
    thumbPath: { type: String },
    mediumPath: { type: String },
    originalName: { type: String },
  },
  { _id: true }
);

const propertySchema = new Schema<IProperty>(
  {
    propertyCode: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    purpose: { type: String, enum: PROPERTY_PURPOSES, required: true, index: true },
    propertyType: { type: Schema.Types.ObjectId, ref: 'PropertyType', required: true, index: true },
    status: { type: String, enum: PROPERTY_STATUSES, default: 'available', index: true },
    expectedPrice: { type: Number, min: 0 },
    rentAmount: { type: Number, min: 0 },
    securityDeposit: { type: Number, min: 0 },
    maintenanceCharges: { type: Number, min: 0 },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    area: { type: String, trim: true },
    landmark: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    publicLocationLabel: { type: String, trim: true },
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    balconies: { type: Number, min: 0 },
    parking: { type: Number, min: 0 },
    superBuiltUpArea: { type: Number, min: 0 },
    carpetArea: { type: Number, min: 0 },
    furnishedStatus: { type: String, enum: FURNISHED_STATUSES },
    amenities: [{ type: Schema.Types.ObjectId, ref: 'PropertyAmenity' }],
    featuredImage: { type: mediaItemSchema },
    gallery: { type: [mediaItemSchema], default: [] },
    videos: [{ path: { type: String, required: true }, title: { type: String } }],
    floorPlans: { type: [mediaItemSchema], default: [] },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    publishOnWebsite: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    showPrice: { type: Boolean, default: true },
    hideExactLocation: { type: Boolean, default: true },
    inquiryCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    dealId: { type: Schema.Types.ObjectId },
    bookingId: { type: Schema.Types.ObjectId },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

propertySchema.index({ deletedAt: 1 });
propertySchema.index({ title: 'text' });

export const PropertyModel = mongoose.model<IProperty>('Property', propertySchema);
