import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'

interface BuildAppOptions {
  nodeEnv?: string
  appBaseUrl?: string
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const { nodeEnv = 'development', appBaseUrl = '*' } = opts

  const app = Fastify({
    logger: {
      level: nodeEnv === 'test' ? 'silent' : 'info',
    },
  })

  app.register(cors, {
    origin: appBaseUrl,
  })

  app.get('/api/v1/health', async () => {
    return { status: 'ok' }
  })

  return app
}
