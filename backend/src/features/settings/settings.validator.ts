import { z } from 'zod';

export const updateLeadAssignmentSchema = z.object({
  body: z.object({
    mode: z.enum(['manual', 'round_robin']),
    roundRobinEmployeeIds: z.array(z.string()).optional(),
  }),
});
