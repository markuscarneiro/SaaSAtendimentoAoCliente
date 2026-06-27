import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import bcrypt from 'bcryptjs'
import { buildApp } from '../server'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const JWT_SECRET = 'test-secret-32-chars-do-not-use-in-production!!'

const REGISTER_URL = '/api/v1/auth/register-organization'
const LOGIN_URL = '/api/v1/auth/login'
const ME_URL = '/api/v1/me'

// ----------------------------------------------------------------
// Shared mock factories
// ----------------------------------------------------------------
function makeMockRedis(emailCount = '0', ipCount = '0'): Redis {
  return {
    get: vi
      .fn()
      .mockResolvedValueOnce(emailCount)
      .mockResolvedValueOnce(ipCount),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    del: vi.fn().mockResolvedValue(1),
    pipeline: vi.fn().mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }),
  } as unknown as Redis
}

// ================================================================
// POST /api/v1/auth/register-organization
// ================================================================
describe('POST /api/v1/auth/register-organization', () => {
  let app: FastifyInstance

  const orgData = {
    id: 'org-uuid',
    name: 'Acme Inc',
    slug: 'acme-inc',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const userData = {
    id: 'user-uuid',
    name: 'Alice',
    email: 'alice@acme.com',
    passwordHash: 'hash',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  function makeRegisterPrisma(userExists = false): PrismaClient {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(userExists ? userData : null),
        create: vi.fn().mockResolvedValue(userData),
      },
      organization: {
        create: vi.fn().mockResolvedValue(orgData),
      },
      organizationMember: {
        create: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn(),
      },
    } as unknown as PrismaClient

    ;(mockPrisma as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction = vi.fn(
      async (fn: (tx: unknown) => unknown) => fn(mockPrisma),
    )

    return mockPrisma
  }

  afterEach(async () => {
    await app?.close()
  })

  it('201 — cria org e owner com dados válidos', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeRegisterPrisma(false),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: REGISTER_URL,
      payload: {
        organizationName: 'Acme Inc',
        ownerName: 'Alice',
        ownerEmail: 'alice@acme.com',
        password: 'senhaSegura123',
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.organization).toMatchObject({ id: 'org-uuid', name: 'Acme Inc' })
    expect(body.data.user).toMatchObject({ id: 'user-uuid', email: 'alice@acme.com' })
    expect(body.error).toBeNull()
  })

  it('409 — email já registrado', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeRegisterPrisma(true),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: REGISTER_URL,
      payload: {
        organizationName: 'Acme Inc',
        ownerName: 'Alice',
        ownerEmail: 'alice@acme.com',
        password: 'senhaSegura123',
      },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('CONFLICT')
  })

  it('400 — senha fora da política (menos de 8 chars)', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeRegisterPrisma(),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: REGISTER_URL,
      payload: {
        organizationName: 'Acme Inc',
        ownerName: 'Alice',
        ownerEmail: 'alice@acme.com',
        password: '12345',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('400 — email inválido', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeRegisterPrisma(),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: REGISTER_URL,
      payload: {
        organizationName: 'Acme Inc',
        ownerName: 'Alice',
        ownerEmail: 'not-an-email',
        password: 'senhaSegura123',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('normaliza email para lowercase no registro', async () => {
    const prisma = makeRegisterPrisma(false)
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma,
      redis: makeMockRedis(),
    })

    await app.inject({
      method: 'POST',
      url: REGISTER_URL,
      payload: {
        organizationName: 'Acme Inc',
        ownerName: 'Alice',
        ownerEmail: '  ALICE@ACME.COM  ',
        password: 'senhaSegura123',
      },
    })

    const { findUnique } = (prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user
    expect(findUnique).toHaveBeenCalledWith({ where: { email: 'alice@acme.com' } })
  })
})

// ================================================================
// POST /api/v1/auth/login
// ================================================================
describe('POST /api/v1/auth/login', () => {
  let app: FastifyInstance
  let passwordHash: string
  const passwordPlain = 'senhaSegura123'

  // Compute hash once before all tests in this describe
  beforeEach(async () => {
    if (!passwordHash) {
      // rounds=4 para testes rápidos (padrão é 12 em produção)
      passwordHash = await bcrypt.hash(passwordPlain, 4)
    }
  })

  afterEach(async () => {
    await app?.close()
  })

  function makeLoginPrisma(
    userOverrides: Record<string, unknown> = {},
    membershipOrNull: unknown = undefined,
  ): PrismaClient {
    const user = {
      id: 'user-uuid',
      name: 'Alice',
      email: 'alice@acme.com',
      passwordHash,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userOverrides,
    }

    const membership =
      membershipOrNull !== undefined
        ? membershipOrNull
        : {
            id: 'mem-uuid',
            organizationId: 'org-uuid',
            userId: user.id,
            role: 'owner',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            organization: { id: 'org-uuid', name: 'Acme Inc' },
          }

    return {
      user: { findUnique: vi.fn().mockResolvedValue(user) },
      organization: { create: vi.fn() },
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(membership),
      },
      $transaction: vi.fn(),
    } as unknown as PrismaClient
  }

  it('200 — login válido retorna JWT e dados', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeLoginPrisma(),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: 'alice@acme.com', password: passwordPlain },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.accessToken).toBeTruthy()
    expect(body.data.user).toMatchObject({ email: 'alice@acme.com' })
    expect(body.data.organization).toMatchObject({ id: 'org-uuid' })
    expect(body.data.role).toBe('owner')
  })

  it('401 — senha incorreta (erro genérico, sem enumeração de email)', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeLoginPrisma(),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: 'alice@acme.com', password: 'senhaErrada' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json().error.message).toBe('Invalid email or password')
  })

  it('401 — usuário inexistente (mesmo erro genérico)', async () => {
    const prismaNotFound = {
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      organization: { create: vi.fn() },
      organizationMember: { create: vi.fn(), findFirst: vi.fn() },
      $transaction: vi.fn(),
    } as unknown as PrismaClient

    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: prismaNotFound,
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: 'nao@existe.com', password: 'qualquerSenha' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json().error.message).toBe('Invalid email or password')
  })

  it('401 — usuário inativo', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeLoginPrisma({ status: 'inactive' }),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: 'alice@acme.com', password: passwordPlain },
    })

    expect(res.statusCode).toBe(401)
  })

  it('401 — sem vínculo ativo na organização', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeLoginPrisma({}, null),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: 'alice@acme.com', password: passwordPlain },
    })

    expect(res.statusCode).toBe(401)
  })

  it('429 — rate limit por email excedido (>= 10 tentativas)', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeLoginPrisma(),
      redis: makeMockRedis('10', '0'), // email at limit
      rateLimitMax: 10,
      rateLimitWindowSeconds: 900,
    })

    const res = await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: 'alice@acme.com', password: passwordPlain },
    })

    expect(res.statusCode).toBe(429)
    expect(res.json().error.code).toBe('RATE_LIMITED')
  })

  it('429 — rate limit por IP excedido', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeLoginPrisma(),
      redis: makeMockRedis('0', '10'), // ip at limit
      rateLimitMax: 10,
    })

    const res = await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: 'alice@acme.com', password: passwordPlain },
    })

    expect(res.statusCode).toBe(429)
    expect(res.json().error.code).toBe('RATE_LIMITED')
  })

  it('normaliza email antes de verificar (case-insensitive)', async () => {
    const prisma = makeLoginPrisma()
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma,
      redis: makeMockRedis(),
    })

    await app.inject({
      method: 'POST',
      url: LOGIN_URL,
      payload: { email: '  ALICE@ACME.COM  ', password: passwordPlain },
    })

    const { findUnique } = (prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user
    expect(findUnique).toHaveBeenCalledWith({ where: { email: 'alice@acme.com' } })
  })
})

// ================================================================
// GET /api/v1/me
// ================================================================
describe('GET /api/v1/me', () => {
  let app: FastifyInstance

  const user = {
    id: 'user-uuid',
    name: 'Alice',
    email: 'alice@acme.com',
    passwordHash: 'hash',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const org = { id: 'org-uuid', name: 'Acme Inc' }
  const membership = {
    id: 'mem-uuid',
    organizationId: 'org-uuid',
    userId: 'user-uuid',
    role: 'owner',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: org,
  }

  function makeMePrisma(
    userOverride?: Partial<typeof user>,
    membershipOverride?: unknown,
  ): PrismaClient {
    return {
      user: {
        findUnique: vi.fn().mockResolvedValue(userOverride ? { ...user, ...userOverride } : user),
        create: vi.fn(),
      },
      organization: { create: vi.fn() },
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(
          membershipOverride !== undefined ? membershipOverride : membership,
        ),
      },
      $transaction: vi.fn(),
    } as unknown as PrismaClient
  }

  afterEach(async () => {
    await app?.close()
  })

  it('200 — retorna usuário, org, role e permissions com token válido', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeMePrisma(),
      redis: makeMockRedis(),
    })

    await app.ready()
    const token = app.jwt.sign({ sub: 'user-uuid', organizationId: 'org-uuid' })

    const res = await app.inject({
      method: 'GET',
      url: ME_URL,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.user).toMatchObject({ id: 'user-uuid', email: 'alice@acme.com' })
    expect(body.data.organization).toMatchObject({ id: 'org-uuid' })
    expect(body.data.role).toBe('owner')
    expect(Array.isArray(body.data.permissions)).toBe(true)
    expect(body.data.permissions.length).toBeGreaterThan(0)
    expect(body.error).toBeNull()
  })

  it('401 — sem token Authorization', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeMePrisma(),
      redis: makeMockRedis(),
    })

    const res = await app.inject({ method: 'GET', url: ME_URL })

    expect(res.statusCode).toBe(401)
    expect(res.json().error.code).toBe('UNAUTHENTICATED')
  })

  it('401 — token com assinatura inválida', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeMePrisma(),
      redis: makeMockRedis(),
    })

    const res = await app.inject({
      method: 'GET',
      url: ME_URL,
      headers: { authorization: 'Bearer token.invalido.aqui' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('401 — usuário inativo após verificar token', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeMePrisma({ status: 'inactive' }),
      redis: makeMockRedis(),
    })

    await app.ready()
    const token = app.jwt.sign({ sub: 'user-uuid', organizationId: 'org-uuid' })

    const res = await app.inject({
      method: 'GET',
      url: ME_URL,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(401)
  })

  it('401 — sem vínculo ativo na organização do token', async () => {
    app = buildApp({
      nodeEnv: 'test',
      jwtSecret: JWT_SECRET,
      prisma: makeMePrisma(undefined, null),
      redis: makeMockRedis(),
    })

    await app.ready()
    const token = app.jwt.sign({ sub: 'user-uuid', organizationId: 'org-uuid' })

    const res = await app.inject({
      method: 'GET',
      url: ME_URL,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(401)
  })
})
