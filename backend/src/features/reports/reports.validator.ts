import { z } from 'zod';
import { LEAD_CATEGORIES } from '../../constants/lead.constants';

export const reportFiltersSchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    employeeId: z.string().optional(),
    leadSourceId: z.string().optional(),
    propertyTypeId: z.string().optional(),
    category: z.enum([...LEAD_CATEGORIES, 'buy', 'sell', 'rent'] as [string, ...string[]]).optional(),
  }),
});

export const reportExportSchema = z.object({
  query: reportFiltersSchema.shape.query.extend({
    report: z.enum(['overview', 'leads', 'employees', 'properties', 'visits']),
    format: z.enum(['csv', 'xlsx']),
  }),
});
