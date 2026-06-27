import Redis from 'ioredis'

let instance: Redis | null = null

export function getRedis(redisUrl: string): Redis {
  if (!instance) {
    instance = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    })
  }
  return instance
}

export async function closeRedis(): Promise<void> {
  if (instance) {
    await instance.quit()
    instance = null
  }
}
