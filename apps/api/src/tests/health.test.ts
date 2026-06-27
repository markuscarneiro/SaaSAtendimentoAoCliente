import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../server'

// Cenário 1: sem dependências reais → defaults 'ok' (testa roteamento)
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

// Cenário 2: DATABASE_URL aponta para porta fechada → database: 'error'
describe('GET /api/v1/health — database inacessível', () => {
  // Porta 19999 em loopback: connection refused imediato
  const app = buildApp({
    nodeEnv: 'test',
    databaseUrl: 'postgresql://x:x@127.0.0.1:19999/x',
  })

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
