import { z } from 'zod';
import { VISIT_TYPES, VISIT_STATUSES, VISIT_HISTORY_ACTIONS } from '../../constants/visit.constants';

export const listVisitsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    type: z.enum(VISIT_TYPES as unknown as [string, ...string[]]).optional(),
    status: z.enum(VISIT_STATUSES as unknown as [string, ...string[]]).optional(),
    favorite: z.enum(['true', 'false']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const createVisitSchema = z.object({
  body: z.object({
    leadId: z.string().min(1, 'Lead is required'),
    type: z.enum(VISIT_TYPES as unknown as [string, ...string[]]),
    scheduledDate: z.string().min(1, 'Scheduled date is required'),
    scheduledTime: z.string().optional(),
    remark: z.string().optional(),
    status: z.enum(VISIT_STATUSES as unknown as [string, ...string[]]).optional(),
  }),
});

export const updateVisitSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    type: z.enum(VISIT_TYPES as unknown as [string, ...string[]]).optional(),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
    remark: z.string().optional(),
    status: z.enum(VISIT_STATUSES as unknown as [string, ...string[]]).optional(),
  }),
});

export const addVisitHistorySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    action: z.enum(VISIT_HISTORY_ACTIONS as unknown as [string, ...string[]]).default('note'),
    remark: z.string().min(1, 'Remark is required').trim(),
  }),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>['body'];
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>['body'];
export type AddVisitHistoryInput = z.infer<typeof addVisitHistorySchema>['body'];
