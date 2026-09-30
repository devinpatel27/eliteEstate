import { z } from 'zod';

export const createMasterSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required').trim(),
    status: z.enum(['active', 'inactive']).default('active'),
    sortOrder: z.coerce.number().optional(),
  }),
});

export const updateMasterSchema = z.object({
  body: z.object({
    name: z.string().min(2).trim().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    sortOrder: z.coerce.number().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const createFollowUpActivitySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required').trim(),
    parent: z.string().min(1).optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']).default('active'),
    sortOrder: z.coerce.number().optional(),
  }),
});

export const updateFollowUpActivitySchema = z.object({
  body: z.object({
    name: z.string().min(2).trim().optional(),
    parent: z.string().min(1).optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']).optional(),
    sortOrder: z.coerce.number().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export type CreateMasterInput = z.infer<typeof createMasterSchema>['body'];
export type UpdateMasterInput = z.infer<typeof updateMasterSchema>['body'];
export type CreateFollowUpActivityInput = z.infer<typeof createFollowUpActivitySchema>['body'];
export type UpdateFollowUpActivityInput = z.infer<typeof updateFollowUpActivitySchema>['body'];
