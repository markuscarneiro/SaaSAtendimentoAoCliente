import { z } from 'zod'

export const registerOrgSchema = z.object({
  organizationName: z.string().min(1).max(255),
  ownerName: z.string().min(1).max(255),
  ownerEmail: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type RegisterOrgInput = z.infer<typeof registerOrgSchema>
export type LoginInput = z.infer<typeof loginSchema>
