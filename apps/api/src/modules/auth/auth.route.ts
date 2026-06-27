import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { registerOrgSchema, loginSchema } from './auth.schema'
import { registerOrganization, loginUser } from './auth.service'
import { ok } from '../../common/reply'
import { validationError, unauthenticated } from '../../common/errors'
import { createAuthenticate } from '../../middleware/authenticate'

interface AuthRoutesOpts {
  prisma: PrismaClient
  redis: Redis
  rateLimitMax: number
  rateLimitWindowSeconds: number
  jwtExpiresIn: string
}

export async function authRoutes(app: FastifyInstance, opts: AuthRoutesOpts) {
  const { prisma, redis, rateLimitMax, rateLimitWindowSeconds, jwtExpiresIn } = opts
  const authenticate = createAuthenticate(prisma)

  // POST /api/v1/auth/register-organization
  app.post('/api/v1/auth/register-organization', async (request, reply) => {
    const parsed = registerOrgSchema.safeParse(request.body)
    if (!parsed.success) {
      throw validationError('Invalid request payload', parsed.error.issues)
    }

    const result = await registerOrganization(prisma, parsed.data)
    return reply.code(201).send(ok(result))
  })

  // POST /api/v1/auth/login
  app.post('/api/v1/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      throw validationError('Invalid request payload', parsed.error.issues)
    }

    const clientIp =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      request.ip ??
      'unknown'

    const result = await loginUser(
      prisma,
      redis,
      parsed.data,
      clientIp,
      rateLimitMax,
      rateLimitWindowSeconds,
    )

    const token = await reply.jwtSign(result.jwtPayload, { expiresIn: jwtExpiresIn })

    return reply.code(200).send(
      ok({
        accessToken: token,
        user: result.user,
        organization: result.organization,
        role: result.role,
      }),
    )
  })

  // GET /api/v1/me — protected
  app.get('/api/v1/me', { preHandler: authenticate }, async (request, reply) => {
    // authUser is guaranteed non-null by authenticate preHandler
    const { userId, organizationId, role, permissions } = request.authUser!

    const [user, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.organizationMember.findFirst({
        where: { userId, organizationId, status: 'active' },
        include: { organization: { select: { id: true, name: true } } },
      }),
    ])

    if (!user || !membership) throw unauthenticated()

    return reply.code(200).send(
      ok({
        user,
        organization: membership.organization,
        role,
        permissions,
      }),
    )
  })
}
