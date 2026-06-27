import { parseEnv } from './config/env'
import { buildApp } from './server'
import { getRedis } from './infra/redis'
import { getDatabase } from './infra/database'

async function main() {
  const env = parseEnv()
  const prisma = getDatabase()
  const redis = getRedis(env.REDIS_URL)

  const app = buildApp({
    nodeEnv: env.NODE_ENV,
    appBaseUrl: env.APP_BASE_URL,
    prisma,
    redis,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    rateLimitMax: env.RATE_LIMIT_LOGIN_MAX,
    rateLimitWindowSeconds: env.RATE_LIMIT_LOGIN_WINDOW_SECONDS,
  })

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
