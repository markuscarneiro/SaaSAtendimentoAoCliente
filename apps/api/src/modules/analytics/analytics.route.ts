import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { overviewQuerySchema } from './analytics.schema'
import { getOverview } from './analytics.service'
import { validationError } from '../../common/errors'
import { createAuthenticate } from '../../middleware/authenticate'
import { requirePermission } from '../../common/require-permission'

interface AnalyticsRoutesOpts {
  prisma: PrismaClient
}

export async function analyticsRoutes(app: FastifyInstance, opts: AnalyticsRoutesOpts) {
  const { prisma } = opts
  const authenticate = createAuthenticate(prisma)
  const canReadAnalytics = requirePermission('analytics.read')

  // GET /api/v1/analytics/overview
  app.get(
    '/api/v1/analytics/overview',
    { preHandler: [authenticate, canReadAnalytics] },
    async (request, reply) => {
      const parsed = overviewQuerySchema.safeParse(request.query)
      if (!parsed.success) throw validationError('Invalid query parameters', parsed.error.issues)

      const result = await getOverview(prisma, request.authUser!.organizationId, parsed.data)
      return reply.code(200).send({ ...result, error: null })
    },
  )
}
