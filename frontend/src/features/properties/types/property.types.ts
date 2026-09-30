export type PropertyPurpose = 'buy' | 'sell' | 'rent';
export type PropertyStatus = 'available' | 'sold' | 'rented' | 'reserved' | 'under_negotiation';
export type FurnishedStatus = 'fully' | 'semi' | 'unfurnished';

export interface PropertyMediaItem {
  _id?: string;
  path: string;
  thumbPath?: string;
  mediumPath?: string;
  originalName?: string;
}

export interface MasterRef {
  _id: string;
  name: string;
  slug?: string;
}

export interface Property {
  _id: string;
  propertyCode: string;
  title: string;
  slug: string;
  description?: string;
  purpose: PropertyPurpose;
  propertyType: MasterRef;
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
  amenities: MasterRef[];
  featuredImage?: PropertyMediaItem;
  gallery: PropertyMediaItem[];
  videos: { _id?: string; path: string; title?: string }[];
  floorPlans: PropertyMediaItem[];
  metaTitle?: string;
  metaDescription?: string;
  publishOnWebsite: boolean;
  isFeatured: boolean;
  showPrice: boolean;
  hideExactLocation: boolean;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyDashboardStats {
  total: number;
  buy: number;
  sell: number;
  rent: number;
  published: number;
  featured: number;
  sold: number;
  rented: number;
}

export interface PropertyListParams {
  page?: number;
  limit?: number;
  search?: string;
  purpose?: PropertyPurpose;
  status?: PropertyStatus;
  propertyType?: string;
  publishOnWebsite?: boolean;
  isFeatured?: boolean;
  city?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PropertyInquiry {
  _id: string;
  propertyId: string;
  name: string;
  mobile: string;
  email?: string;
  message?: string;
  leadId?: string;
  createdAt: string;
}

export interface CreatePropertyData {
  title: string;
  description?: string;
  purpose: PropertyPurpose;
  propertyType: string;
  status?: PropertyStatus;
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
  amenities?: string[];
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  publishOnWebsite?: boolean;
  isFeatured?: boolean;
  showPrice?: boolean;
  hideExactLocation?: boolean;
}

export interface LeadAssignmentSettings {
  mode: 'manual' | 'round_robin';
  roundRobinEmployeeIds: string[];
  lastAssignedIndex: number;
}
