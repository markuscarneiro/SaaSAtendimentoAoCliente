import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'

type ServiceStatus = 'ok' | 'error'

// Em T1.2 usávamos TCP; agora que Prisma existe, usamos $queryRaw (deployment-spec §5).
export async function checkDatabase(prisma: PrismaClient): Promise<ServiceStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return 'ok'
  } catch {
    return 'error'
  }
}

export async function checkRedis(redis: Redis): Promise<ServiceStatus> {
  try {
    const result = await Promise.race<string>([
      redis.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('redis ping timeout')), 3000),
      ),
    ])
    return result === 'PONG' ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}
