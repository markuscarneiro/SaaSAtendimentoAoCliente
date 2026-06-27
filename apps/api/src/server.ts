import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { checkDatabase, checkRedis } from './infra/health'

interface BuildAppOptions {
  nodeEnv?: string
  appBaseUrl?: string
  // Dependências de infra — opcionais para testes unitários (padrão: 'ok')
  prisma?: PrismaClient
  redis?: Redis
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const { nodeEnv = 'development', appBaseUrl = '*' } = opts

  const app = Fastify({
    logger: {
      level: nodeEnv === 'test' ? 'silent' : 'info',
    },
  })

  app.register(cors, { origin: appBaseUrl })

  // ---- Health check (api-contract.md §6.5, deployment-spec §5) ----
  // Rota pública. Exceção ao envelope padrão: não usa data/meta/error.
  // 200 → tudo ok; 503 → algum serviço indisponível.
  app.get('/api/v1/health', async (_, reply) => {
    const [database, redis] = await Promise.all([
      opts.prisma
        ? checkDatabase(opts.prisma)
        : Promise.resolve<'ok'>('ok'),
      opts.redis
        ? checkRedis(opts.redis)
        : Promise.resolve<'ok'>('ok'),
    ])

    const allOk = database === 'ok' && redis === 'ok'
    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'error',
      services: { database, redis },
    })
  })

  return app
}
