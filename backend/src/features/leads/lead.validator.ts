import { z } from 'zod';
import {
  LEAD_CATEGORIES,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  FOLLOW_UP_TYPES,
} from '../../constants/lead.constants';

const mobileSchema = z
  .string()
  .min(10, 'Mobile number is required')
  .refine((val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '').slice(-10)), {
    message: 'Invalid mobile number',
  });

export const createLeadSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Customer name is required').trim(),
    mobile: mobileSchema,
    alternateMobile: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    city: z.string().optional(),
    address: z.string().optional(),
    category: z.enum(LEAD_CATEGORIES as unknown as [string, ...string[]]),
    propertyType: z.string().min(1, 'Property type is required'),
    propertyConfiguration: z.string().optional(),
    leadSource: z.string().min(1, 'Lead source is required'),
    budgetMin: z.coerce.number().min(0).optional(),
    budgetMax: z.coerce.number().min(0).optional(),
    preferredArea: z.string().optional(),
    assignedTo: z.string().optional(),
    priority: z.enum(LEAD_PRIORITIES as unknown as [string, ...string[]]).default('warm'),
    nextFollowUpDate: z.string().optional(),
    initialRemark: z.string().optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    customerName: z.string().min(2).trim().optional(),
    mobile: mobileSchema.optional(),
    alternateMobile: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().optional(),
    address: z.string().optional(),
    category: z.enum(LEAD_CATEGORIES as unknown as [string, ...string[]]).optional(),
    propertyType: z.string().optional(),
    propertyConfiguration: z.string().optional(),
    leadSource: z.string().optional(),
    budgetMin: z.coerce.number().min(0).optional(),
    budgetMax: z.coerce.number().min(0).optional(),
    preferredArea: z.string().optional(),
    priority: z.enum(LEAD_PRIORITIES as unknown as [string, ...string[]]).optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listLeadsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(LEAD_STATUSES as unknown as [string, ...string[]]).optional(),
    category: z.enum(LEAD_CATEGORIES as unknown as [string, ...string[]]).optional(),
    priority: z.enum(LEAD_PRIORITIES as unknown as [string, ...string[]]).optional(),
    propertyType: z.string().optional(),
    propertyConfiguration: z.string().optional(),
    leadSource: z.string().optional(),
    assignedTo: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    nfdFrom: z.string().optional(),
    nfdTo: z.string().optional(),
    followUpDue: z.enum(['today', 'tomorrow', 'overdue']).optional(),
  }),
});

export const checkMobileSchema = z.object({
  query: z.object({ mobile: z.string().min(1) }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(LEAD_STATUSES as unknown as [string, ...string[]]),
    remark: z.string().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const transferLeadSchema = z.object({
  body: z.object({
    assignedTo: z.string().min(1, 'Employee is required'),
    transferRemark: z.string().min(1, 'Transfer remark is required').trim(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const createFollowUpSchema = z.object({
  body: z.object({
    followUpDate: z.string().min(1, 'Follow-up date is required'),
    followUpTime: z.string().optional(),
    type: z.enum(FOLLOW_UP_TYPES as unknown as [string, ...string[]]),
    priority: z.enum(LEAD_PRIORITIES as unknown as [string, ...string[]]).optional(),
    status: z.enum(LEAD_STATUSES as unknown as [string, ...string[]]).optional(),
    parentActivity: z.string().optional(),
    childActivity: z.string().optional(),
    remark: z.string().optional(),
    nextFollowUpDate: z.string().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const addNoteSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Note text is required').trim(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const bulkUpdateStatusSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string().min(1)).min(1, 'At least one lead ID is required'),
    status: z.enum(LEAD_STATUSES as unknown as [string, ...string[]]),
    remark: z.string().optional(),
  }),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>['body'];
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>['body'];
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];
export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>['body'];
export type TransferLeadInput = z.infer<typeof transferLeadSchema>['body'];
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>['body'];
export type AddNoteInput = z.infer<typeof addNoteSchema>['body'];
