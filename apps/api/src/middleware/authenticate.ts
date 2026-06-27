import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { unauthenticated } from '../common/errors'
import { getPermissionsForRole } from '../common/permissions'

interface JwtPayload {
  sub: string
  organizationId: string
}

export function createAuthenticate(prisma: PrismaClient) {
  return async function authenticate(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    let payload: JwtPayload

    try {
      await request.jwtVerify()
      payload = request.user as unknown as JwtPayload
    } catch {
      throw unauthenticated()
    }

    if (!payload?.sub || !payload?.organizationId) {
      throw unauthenticated()
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.status !== 'active') throw unauthenticated()

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: payload.organizationId,
        status: 'active',
      },
    })
    if (!membership) throw unauthenticated()

    request.authUser = {
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      permissions: getPermissionsForRole(membership.role),
    }
  }
}
