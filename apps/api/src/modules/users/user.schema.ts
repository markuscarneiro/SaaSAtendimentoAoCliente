import { z } from 'zod'

const ASSIGNABLE_ROLES = ['admin', 'manager', 'agent', 'viewer'] as const

export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(ASSIGNABLE_ROLES),
})

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'createdAt']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

export const patchUserSchema = z
  .object({
    role: z.enum(ASSIGNABLE_ROLES).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((d) => d.role !== undefined || d.status !== undefined, {
    message: 'At least one field (role or status) must be provided',
  })

export type CreateUserInput = z.infer<typeof createUserSchema>
export type ListUsersParams = z.infer<typeof listUsersSchema>
export type PatchUserInput = z.infer<typeof patchUserSchema>
