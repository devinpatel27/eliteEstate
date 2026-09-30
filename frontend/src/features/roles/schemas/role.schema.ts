import { z } from 'zod';

export const roleSchema = z.object({
  roleName: z.string().min(2, 'Role name must be at least 2 characters').trim(),
  permissions: z.array(z.string()).default([]),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
