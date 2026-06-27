import { describe, it, expect, afterAll, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { buildApp } from '../server'

// Cenário 1: sem dependências reais → defaults 'ok' (testa roteamento e formato)
describe('GET /api/v1/health — sem infra real', () => {
  const app = buildApp({ nodeEnv: 'test' })

  afterAll(async () => {
    await app.close()
  })

  it('retorna 200 com status ok e serviços ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      status: 'ok',
      services: { database: 'ok', redis: 'ok' },
    })
  })
})

// Cenário 2: Prisma mock que lança erro → database: 'error', HTTP 503
describe('GET /api/v1/health — database inacessível', () => {
  const mockPrisma = {
    $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')),
  } as unknown as PrismaClient

  const app = buildApp({ nodeEnv: 'test', prisma: mockPrisma })

  afterAll(async () => {
    await app.close()
  })

  it('retorna 503 com database: error', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' })

    expect(res.statusCode).toBe(503)
    expect(res.json()).toMatchObject({
      status: 'error',
      services: { database: 'error' },
    })
  })
})
