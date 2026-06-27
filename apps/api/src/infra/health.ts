import net from 'net'
import type Redis from 'ioredis'

type ServiceStatus = 'ok' | 'error'

function tcpCheck(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port })
    socket.setTimeout(timeoutMs)
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

export async function checkDatabase(databaseUrl: string): Promise<ServiceStatus> {
  try {
    const url = new URL(databaseUrl)
    const ok = await tcpCheck(url.hostname, parseInt(url.port || '5432', 10))
    return ok ? 'ok' : 'error'
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
