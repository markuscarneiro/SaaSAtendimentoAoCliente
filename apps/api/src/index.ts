import { parseEnv } from './config/env'
import { buildApp } from './server'
import { getRedis } from './infra/redis'

async function main() {
  const env = parseEnv()
  const redis = getRedis(env.REDIS_URL)

  const app = buildApp({
    nodeEnv: env.NODE_ENV,
    appBaseUrl: env.APP_BASE_URL,
    redis,
    databaseUrl: env.DATABASE_URL,
  })

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
