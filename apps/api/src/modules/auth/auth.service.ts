import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { conflict, unauthenticated, rateLimited } from '../../common/errors'
import type { RegisterOrgInput, LoginInput } from './auth.schema'

const BCRYPT_ROUNDS = 12

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function registerOrganization(
  prisma: PrismaClient,
  input: RegisterOrgInput,
) {
  const email = input.ownerEmail.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw conflict('Email already registered')

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const slug = slugify(input.organizationName)

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: input.organizationName, slug, status: 'active' },
    })

    const user = await tx.user.create({
      data: { name: input.ownerName, email, passwordHash, status: 'active' },
    })

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'owner',
        status: 'active',
      },
    })

    return {
      organization: { id: org.id, name: org.name },
      user: { id: user.id, name: user.name, email: user.email },
    }
  })
}

export async function loginUser(
  prisma: PrismaClient,
  redis: Redis,
  input: LoginInput,
  clientIp: string,
  maxAttempts: number,
  windowSeconds: number,
) {
  const email = input.email.trim().toLowerCase()

  const emailKey = `rate_limit:login:email:${email}`
  const ipKey = `rate_limit:login:ip:${clientIp}`

  const [rawEmail, rawIp] = await Promise.all([redis.get(emailKey), redis.get(ipKey)])
  if (Number(rawEmail) >= maxAttempts || Number(rawIp) >= maxAttempts) {
    throw rateLimited()
  }

  const genericError = unauthenticated('Invalid email or password')

  async function incrementFailure(): Promise<void> {
    const pl = redis.pipeline()
    pl.incr(emailKey)
    pl.expire(emailKey, windowSeconds)
    pl.incr(ipKey)
    pl.expire(ipKey, windowSeconds)
    await pl.exec()
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    await incrementFailure()
    throw genericError
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash)
  if (!passwordMatch || user.status !== 'active') {
    await incrementFailure()
    throw genericError
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, status: 'active' },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) {
    await incrementFailure()
    throw genericError
  }

  await Promise.all([redis.del(emailKey), redis.del(ipKey)])

  return {
    user: { id: user.id, name: user.name, email: user.email },
    organization: { id: membership.organization.id, name: membership.organization.name },
    role: membership.role,
    jwtPayload: { sub: user.id, organizationId: membership.organizationId },
  }
}
