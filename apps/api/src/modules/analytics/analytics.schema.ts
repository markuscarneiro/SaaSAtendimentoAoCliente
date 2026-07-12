import { z } from 'zod'

export const overviewQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)').optional(),
})

export type OverviewQuery = z.infer<typeof overviewQuerySchema>
