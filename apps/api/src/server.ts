import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { checkDatabase, checkRedis } from './infra/health'
import { authRoutes } from './modules/auth/auth.route'
import { AppError } from './common/errors'
import { errorEnvelope } from './common/reply'

const TEST_JWT_SECRET = 'test-secret-32-chars-do-not-use-in-production!!'

interface BuildAppOptions {
  nodeEnv?: string
  appBaseUrl?: string
  prisma?: PrismaClient
  redis?: Redis
  jwtSecret?: string
  jwtExpiresIn?: string
  rateLimitMax?: number
  rateLimitWindowSeconds?: number
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const {
    nodeEnv = 'development',
    appBaseUrl = '*',
    jwtSecret = TEST_JWT_SECRET,
    jwtExpiresIn = '24h',
    rateLimitMax = 10,
    rateLimitWindowSeconds = 900,
  } = opts

  const app = Fastify({
    logger: { level: nodeEnv === 'test' ? 'silent' : 'info' },
  })

  app.register(cors, { origin: appBaseUrl })

  app.register(jwt, { secret: jwtSecret })

  app.decorateRequest('authUser', null)

  // ---- Global error handler — returns standard envelope --------
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(
        errorEnvelope(error.code, error.message, error.details ?? []),
      )
    }

    // Fastify validation errors (schema-level, if used)
    if ('validation' in error && error.validation) {
      return reply.code(400).send(
        errorEnvelope('VALIDATION_ERROR', 'Invalid request payload', error.validation as unknown[]),
      )
    }

    // JWT errors from @fastify/jwt
    if (error.statusCode === 401) {
      return reply.code(401).send(errorEnvelope('UNAUTHENTICATED', 'Authentication required', []))
    }

    request.log.error(error)
    return reply
      .code(500)
      .send(errorEnvelope('INTERNAL_ERROR', 'Internal server error', []))
  })

  // ---- Health check (api-contract.md §6.5) ----------------------
  app.get('/api/v1/health', async (_, reply) => {
    const [database, redis] = await Promise.all([
      opts.prisma ? checkDatabase(opts.prisma) : Promise.resolve<'ok'>('ok'),
      opts.redis ? checkRedis(opts.redis) : Promise.resolve<'ok'>('ok'),
    ])

    const allOk = database === 'ok' && redis === 'ok'
    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'error',
      services: { database, redis },
    })
  })

  // ---- Auth routes — only registered when infra deps are present ----
  if (opts.prisma && opts.redis) {
    app.register(authRoutes, {
      prisma: opts.prisma,
      redis: opts.redis,
      rateLimitMax,
      rateLimitWindowSeconds,
      jwtExpiresIn,
    })
  }

  return app
}
