import { z } from 'zod';

const mobileSchema = z
  .string()
  .min(10, 'Mobile number is required')
  .refine((val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '').slice(-10)), {
    message: 'Invalid mobile number',
  });

const baseLeadSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required').trim(),
  mobile: mobileSchema,
  alternateMobile: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  city: z.string().optional(),
  address: z.string().optional(),
  category: z.enum(['buy_property', 'sell_property', 'rent_property']),
  propertyType: z.string().min(1, 'Property type is required'),
  propertyConfiguration: z.string().optional(),
  leadSource: z.string().min(1, 'Lead source is required'),
  budgetMin: z.coerce.number().min(0).optional().or(z.literal('')),
  budgetMax: z.coerce.number().min(0).optional().or(z.literal('')),
  preferredArea: z.string().optional(),
  assignedTo: z.string().optional(),
  sharePreviousRemarks: z.boolean().optional(),
  priority: z.enum(['hot', 'warm', 'cold']).default('warm'),
  nextFollowUpDate: z.string().optional(),
  initialRemark: z.string().optional(),
});

const budgetRangeRefine = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const values = data as { budgetMin?: number | ''; budgetMax?: number | '' };
    const min = values.budgetMin === '' ? undefined : values.budgetMin;
    const max = values.budgetMax === '' ? undefined : values.budgetMax;
    if (min !== undefined && max !== undefined && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum budget cannot exceed maximum budget',
        path: ['budgetMax'],
      });
    }
  });

export const createLeadSchema = budgetRangeRefine(baseLeadSchema);

export const updateLeadSchema = budgetRangeRefine(
  baseLeadSchema.partial().omit({ mobile: true, initialRemark: true }).extend({
    mobile: z.string().optional(),
  })
);

export const followUpSchema = z.object({
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  type: z.enum(['call', 'whatsapp', 'meeting', 'property_visit', 'revisit', 'site_visit', 'email', 'negotiation']),
  priority: z.enum(['hot', 'warm', 'cold']).default('warm'),
  status: z.enum(['open', 'hold', 'pending', 'booked', 'closed']).optional(),
  parentActivity: z.string().optional(),
  childActivity: z.string().optional(),
  remark: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  nextFollowUpTime: z.string().optional(),
});

export const transferLeadSchema = z.object({
  sharePreviousRemarks: z.boolean().default(false),
  assignedTo: z.string().min(1, 'Employee is required'),
  transferRemark: z.string().min(1, 'Transfer remark is required').trim(),
});

export const noteSchema = z.object({
  text: z.string().min(1, 'Note is required').trim(),
});

export const statusUpdateSchema = z.object({
  status: z.enum([
    'open', 'pending', 'closed',
  ]),
  remark: z.string().optional(),
});

export type CreateLeadFormValues = z.infer<typeof createLeadSchema>;
export type UpdateLeadFormValues = z.infer<typeof updateLeadSchema>;
export type FollowUpFormValues = z.infer<typeof followUpSchema>;
export type TransferLeadFormValues = z.infer<typeof transferLeadSchema>;
export type NoteFormValues = z.infer<typeof noteSchema>;
