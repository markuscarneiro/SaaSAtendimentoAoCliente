import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'
import { conflict, notFound } from '../../common/errors'
import { paginationSkip, paginationMeta } from '../../common/pagination'
import type { CreateUserInput, ListUsersParams, PatchUserInput } from './user.schema'

const BCRYPT_ROUNDS = 12

interface ServiceLogger {
  info(obj: Record<string, unknown>, msg: string): void
}

// ----------------------------------------------------------------
// POST /api/v1/users
// ----------------------------------------------------------------
export async function createUser(
  prisma: PrismaClient,
  organizationId: string,
  input: CreateUserInput,
) {
  const email = input.email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw conflict('Email already registered')

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email, passwordHash, status: 'active' },
    })

    await tx.organizationMember.create({
      data: { organizationId, userId: user.id, role: input.role, status: 'active' },
    })

    return { id: user.id, name: user.name, email: user.email, role: input.role }
  })
}

// ----------------------------------------------------------------
// GET /api/v1/users
// ----------------------------------------------------------------
export async function listUsers(
  prisma: PrismaClient,
  organizationId: string,
  params: ListUsersParams,
) {
  const orderBy =
    params.sort === 'name'
      ? { user: { name: params.direction } }
      : { createdAt: params.direction }

  const where = { organizationId }

  const [members, total] = await Promise.all([
    prisma.organizationMember.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy,
      skip: paginationSkip(params),
      take: params.pageSize,
    }),
    prisma.organizationMember.count({ where }),
  ])

  return {
    data: members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      status: m.status,
    })),
    meta: paginationMeta(total, params),
  }
}

// ----------------------------------------------------------------
// PATCH /api/v1/users/:id
// ----------------------------------------------------------------
export async function patchUser(
  prisma: PrismaClient,
  organizationId: string,
  targetUserId: string,
  requestUserId: string,
  input: PatchUserInput,
  log: ServiceLogger,
) {
  // Cross-tenant: look up membership in the authenticated org only
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: targetUserId, organizationId },
  })
  if (!membership) throw notFound()

  // Owner protection (spec §5)
  if (membership.role === 'owner') throw conflict('The owner membership cannot be modified')

  // Self-modification prevention (spec §5)
  if (targetUserId === requestUserId) throw conflict('Users cannot modify their own membership')

  const data: { role?: string; status?: string } = {}
  if (input.role !== undefined) {
    data.role = input.role
    log.info(
      { targetUserId, organizationId, from: membership.role, to: input.role },
      'user role changed',
    )
  }
  if (input.status !== undefined) {
    data.status = input.status
  }

  const updated = await prisma.organizationMember.update({
    where: { id: membership.id },
    data,
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return {
    id: updated.user.id,
    name: updated.user.name,
    email: updated.user.email,
    role: updated.role,
    status: updated.status,
  }
}
