import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { createUserSchema, listUsersSchema, patchUserSchema } from './user.schema'
import { createUser, listUsers, patchUser } from './user.service'
import { ok } from '../../common/reply'
import { validationError } from '../../common/errors'
import { createAuthenticate } from '../../middleware/authenticate'
import { requirePermission } from '../../common/require-permission'

interface UserRoutesOpts {
  prisma: PrismaClient
}

export async function userRoutes(app: FastifyInstance, opts: UserRoutesOpts) {
  const { prisma } = opts
  const authenticate = createAuthenticate(prisma)

  const canReadUsers = requirePermission('users.read')
  const canManageUsers = requirePermission('users.manage')

  // GET /api/v1/users
  app.get(
    '/api/v1/users',
    { preHandler: [authenticate, canReadUsers] },
    async (request, reply) => {
      const parsed = listUsersSchema.safeParse(request.query)
      if (!parsed.success) throw validationError('Invalid query parameters', parsed.error.issues)

      const result = await listUsers(prisma, request.authUser!.organizationId, parsed.data)
      return reply.code(200).send({ ...result, error: null })
    },
  )

  // POST /api/v1/users
  app.post(
    '/api/v1/users',
    { preHandler: [authenticate, canManageUsers] },
    async (request, reply) => {
      const parsed = createUserSchema.safeParse(request.body)
      if (!parsed.success) throw validationError('Invalid request payload', parsed.error.issues)

      const result = await createUser(prisma, request.authUser!.organizationId, parsed.data)
      return reply.code(201).send(ok(result))
    },
  )

  // PATCH /api/v1/users/:id
  app.patch(
    '/api/v1/users/:id',
    { preHandler: [authenticate, canManageUsers] },
    async (request, reply) => {
      const { id: targetUserId } = request.params as { id: string }
      const parsed = patchUserSchema.safeParse(request.body)
      if (!parsed.success) throw validationError('Invalid request payload', parsed.error.issues)

      const result = await patchUser(
        prisma,
        request.authUser!.organizationId,
        targetUserId,
        request.authUser!.userId,
        parsed.data,
        request.log as { info(obj: Record<string, unknown>, msg: string): void },
      )
      return reply.code(200).send(ok(result))
    },
  )
}
