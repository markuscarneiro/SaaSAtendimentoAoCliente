import { PrismaClient } from '@prisma/client'

let instance: PrismaClient | null = null

export function getDatabase(): PrismaClient {
  if (!instance) {
    instance = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    })
  }
  return instance
}

export async function closeDatabase(): Promise<void> {
  if (instance) {
    await instance.$disconnect()
    instance = null
  }
}
