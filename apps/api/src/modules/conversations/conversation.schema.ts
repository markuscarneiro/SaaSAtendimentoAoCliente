import { z } from 'zod'

export const createConversationSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(255),
    email: z.string().trim().email().max(255).optional(),
  }),
  subject: z.string().max(255).optional(),
  channel: z.literal('manual').default('manual'),
})

export const listConversationsSchema = z.object({
  status: z
    .enum(['open', 'waiting_customer', 'waiting_agent', 'resolved', 'closed'])
    .optional(),
  assignedUserId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'lastMessageAt']).default('lastMessageAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

export const listMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const createMessageSchema = z.object({
  authorType: z.enum(['agent', 'customer']),
  content: z.string().min(1).max(10000),
})

export const patchConversationSchema = z
  .object({
    assignedUserId: z.string().uuid().nullable().optional(),
    status: z
      .enum(['open', 'waiting_customer', 'waiting_agent', 'resolved', 'closed'])
      .optional(),
  })
  .refine((d) => d.assignedUserId !== undefined || d.status !== undefined, {
    message: 'At least one field (assignedUserId or status) must be provided',
  })

export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type ListConversationsParams = z.infer<typeof listConversationsSchema>
export type ListMessagesParams = z.infer<typeof listMessagesSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type PatchConversationInput = z.infer<typeof patchConversationSchema>
