import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../server'

describe('GET /api/v1/health', () => {
  const app = buildApp({ nodeEnv: 'test' })

  afterAll(async () => {
    await app.close()
  })

  it('returns 200 with status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
