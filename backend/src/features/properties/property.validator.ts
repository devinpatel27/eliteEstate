import { z } from 'zod';
import {
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  FURNISHED_STATUSES,
  PROPERTY_SORT_OPTIONS,
} from '../../constants/property.constants';

const objectIdSchema = z.string().min(1);

const propertyBodyFields = {
  title: z.string().min(2, 'Title is required').trim(),
  description: z.string().optional(),
  purpose: z.enum(PROPERTY_PURPOSES as unknown as [string, ...string[]]),
  propertyType: objectIdSchema,
  status: z.enum(PROPERTY_STATUSES as unknown as [string, ...string[]]).optional(),
  expectedPrice: z.coerce.number().min(0).optional(),
  rentAmount: z.coerce.number().min(0).optional(),
  securityDeposit: z.coerce.number().min(0).optional(),
  maintenanceCharges: z.coerce.number().min(0).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  publicLocationLabel: z.string().optional(),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  balconies: z.coerce.number().min(0).optional(),
  parking: z.coerce.number().min(0).optional(),
  superBuiltUpArea: z.coerce.number().min(0).optional(),
  carpetArea: z.coerce.number().min(0).optional(),
  furnishedStatus: z.enum(FURNISHED_STATUSES as unknown as [string, ...string[]]).optional(),
  amenities: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  slug: z.string().optional(),
  publishOnWebsite: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  showPrice: z.boolean().optional(),
  hideExactLocation: z.boolean().optional(),
};

export const createPropertySchema = z.object({
  body: z.object(propertyBodyFields),
});

export const updatePropertySchema = z.object({
  body: z.object({
    ...Object.fromEntries(
      Object.entries(propertyBodyFields).map(([k, v]) => [
        k,
        k === 'title' || k === 'purpose' || k === 'propertyType'
          ? (v as z.ZodTypeAny).optional()
          : (v as z.ZodTypeAny).optional(),
      ])
    ),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listPropertiesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    purpose: z.enum(PROPERTY_PURPOSES as unknown as [string, ...string[]]).optional(),
    status: z.enum(PROPERTY_STATUSES as unknown as [string, ...string[]]).optional(),
    propertyType: z.string().optional(),
    publishOnWebsite: z.string().optional(),
    isFeatured: z.string().optional(),
    city: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const mediaParamSchema = z.object({
  params: z.object({ id: z.string().min(1), mediaId: z.string().min(1) }),
});

export const uploadMediaSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    mediaType: z.enum(['featured', 'gallery', 'video', 'floorplan']),
    title: z.string().optional(),
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>['body'];

export const publicListPropertiesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    purpose: z.enum(PROPERTY_PURPOSES as unknown as [string, ...string[]]).optional(),
    propertyType: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    area: z.string().optional(),
    beds: z.string().optional(),
    amenities: z.string().optional(),
    sort: z.enum(PROPERTY_SORT_OPTIONS as unknown as [string, ...string[]]).optional(),
  }),
});

export const publicSlugParamSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

const mobileSchema = z
  .string()
  .min(10)
  .refine((val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '').slice(-10)), {
    message: 'Invalid mobile number',
  });

export const propertyInquirySchema = z.object({
  body: z.object({
    propertyId: z.string().min(1),
    propertyTitle: z.string().optional(),
    name: z.string().min(2).trim(),
    mobile: mobileSchema,
    email: z.string().email().optional().or(z.literal('')),
    message: z.string().optional(),
  }),
});

export const contactUsSchema = z.object({
  body: z.object({
    name: z.string().min(2).trim(),
    mobile: mobileSchema,
    email: z.string().email().optional().or(z.literal('')),
    subject: z.string().min(1).trim(),
    message: z.string().min(1).trim(),
  }),
});
