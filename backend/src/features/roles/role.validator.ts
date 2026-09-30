import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    roleName: z.string().min(2, 'Role name must be at least 2 characters').trim(),
    permissions: z.array(z.string()).default([]),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    roleName: z.string().min(2).trim().optional(),
    permissions: z.array(z.string()).optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
