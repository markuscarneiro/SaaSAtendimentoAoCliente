import { describe, it, expect, vi, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { buildApp } from '../server'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const JWT_SECRET = 'test-secret-32-chars-do-not-use-in-production!!'
const ORG_ID = 'org-uuid'
const USER_ID = 'user-uuid'       // requesting user (owner)
const TARGET_ID = 'target-uuid'   // user being managed

const noOpRedis = {} as unknown as Redis

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------
const mockRequester = {
  id: USER_ID, name: 'Alice', email: 'alice@test.com',
  passwordHash: 'hash', status: 'active', createdAt: new Date(), updatedAt: new Date(),
}

function mockMembership(userId = USER_ID, role = 'owner') {
  return {
    id: `mem-${userId}`, organizationId: ORG_ID, userId,
    role, status: 'active', createdAt: new Date(), updatedAt: new Date(),
  }
}

function mockTargetUser(overrides: Record<string, unknown> = {}) {
  return {
    id: TARGET_ID, name: 'Bob', email: 'bob@test.com',
    passwordHash: 'hash', status: 'active', createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  }
}

// ----------------------------------------------------------------
// Prisma mock builder
// ----------------------------------------------------------------
function makePrisma(overrides: Record<string, unknown> = {}): PrismaClient {
  const base: Record<string, unknown> = {
    user: {
      // First call: authenticate middleware looks up the requesting user by ID.
      // Subsequent calls: createUser checks for duplicate by email (should be null).
      findUnique: vi.fn().mockResolvedValueOnce(mockRequester).mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockTargetUser()),
    },
    organization: { create: vi.fn() },
    organizationMember: {
      create: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'owner')),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
    },
    customer: { findFirst: vi.fn(), create: vi.fn() },
    conversation: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    message: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  }

  const merged = { ...base, ...overrides }

  ;(merged as { $transaction: ReturnType<typeof vi.fn> }).$transaction = vi.fn(
    async (fn: (tx: PrismaClient) => unknown) => fn(merged as unknown as PrismaClient),
  )

  return merged as unknown as PrismaClient
}

// ----------------------------------------------------------------
// App + token helper
// ----------------------------------------------------------------
function makeApp(prisma: PrismaClient): FastifyInstance {
  return buildApp({ nodeEnv: 'test', jwtSecret: JWT_SECRET, prisma, redis: noOpRedis })
}

async function authHeader(app: FastifyInstance): Promise<string> {
  await app.ready()
  return `Bearer ${app.jwt.sign({ sub: USER_ID, organizationId: ORG_ID })}`
}

// ================================================================
// POST /api/v1/users
// ================================================================
describe('POST /api/v1/users', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('201 — cria usuário com papel agent', async () => {
    const newUser = mockTargetUser({ id: TARGET_ID, name: 'Bob', email: 'bob@test.com' })
    const prisma = makePrisma({
      user: {
        findUnique: vi.fn().mockResolvedValueOnce(mockRequester).mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(newUser),
      },
      organizationMember: {
        create: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'owner')),
        findMany: vi.fn(), count: vi.fn(), update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: auth },
      payload: { name: 'Bob', email: 'bob@test.com', password: 'senhaSegura123', role: 'agent' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.email).toBe('bob@test.com')
    expect(body.data.role).toBe('agent')
    expect(body.error).toBeNull()
  })

  it('201 — normaliza email para lowercase antes de criar', async () => {
    const prisma = makePrisma({
      user: {
        findUnique: vi.fn().mockResolvedValueOnce(mockRequester).mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockTargetUser({ email: 'bob@test.com' })),
      },
      organizationMember: {
        create: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'owner')),
        findMany: vi.fn(), count: vi.fn(), update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: auth },
      payload: { name: 'Bob', email: '  BOB@TEST.COM  ', password: 'senhaSegura123', role: 'agent' },
    })

    const { findUnique } = (prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user
    expect(findUnique).toHaveBeenCalledWith({ where: { email: 'bob@test.com' } })
  })

  it('400 — rejeita papel owner na criação', async () => {
    app = makeApp(makePrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: auth },
      payload: { name: 'Bob', email: 'bob@test.com', password: 'senhaSegura123', role: 'owner' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('400 — rejeita senha fora da política (menos de 8 chars)', async () => {
    app = makeApp(makePrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: auth },
      payload: { name: 'Bob', email: 'bob@test.com', password: '12345', role: 'agent' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('409 — email duplicado', async () => {
    const prisma = makePrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue(mockTargetUser()), // email already exists
        create: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: auth },
      payload: { name: 'Bob', email: 'bob@test.com', password: 'senhaSegura123', role: 'agent' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('CONFLICT')
  })

  it('403 — viewer não tem users.manage', async () => {
    const prisma = makePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'viewer')),
        findMany: vi.fn(), count: vi.fn(), update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: auth },
      payload: { name: 'Bob', email: 'bob@test.com', password: 'senhaSegura123', role: 'agent' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('401 — sem token', async () => {
    app = makeApp(makePrisma())

    const res = await app.inject({ method: 'POST', url: '/api/v1/users' })
    expect(res.statusCode).toBe(401)
  })
})

// ================================================================
// GET /api/v1/users
// ================================================================
describe('GET /api/v1/users', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('200 — lista membros da organização autenticada com paginação', async () => {
    const members = [
      {
        id: 'mem-1', organizationId: ORG_ID, userId: TARGET_ID, role: 'agent', status: 'active',
        createdAt: new Date(), updatedAt: new Date(),
        user: { id: TARGET_ID, name: 'Bob', email: 'bob@test.com' },
      },
    ]

    const prisma = makePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'owner')),
        findMany: vi.fn().mockResolvedValue(members),
        count: vi.fn().mockResolvedValue(1),
        update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/users',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({ id: TARGET_ID, role: 'agent', status: 'active' })
    expect(body.meta).toMatchObject({ page: 1, pageSize: 20, total: 1 })
    expect(body.error).toBeNull()

    // sempre filtra pela org autenticada
    const { findMany } = (prisma as unknown as { organizationMember: { findMany: ReturnType<typeof vi.fn> } }).organizationMember
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORG_ID } }),
    )
  })

  it('200 — lista vazia quando organização não tem membros além do próprio', async () => {
    const prisma = makePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'owner')),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/users',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toEqual([])
    expect(res.json().meta.total).toBe(0)
  })

  it('400 — sort inválido retorna 400', async () => {
    app = makeApp(makePrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/users?sort=invalidField',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(400)
  })

  it('403 — agente com users.read pode listar; viewer também', async () => {
    // agent tem users.read na matriz
    const prisma = makePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'agent')),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/users',
      headers: { authorization: auth },
    })

    // agent tem users.read → 200
    expect(res.statusCode).toBe(200)
  })
})

// ================================================================
// PATCH /api/v1/users/:id
// ================================================================
describe('PATCH /api/v1/users/:id', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  function makePatchPrisma(
    targetRole = 'agent',
    targetMembershipOverride: unknown = undefined,
    updatedOverride: unknown = undefined,
  ) {
    const targetMembership =
      targetMembershipOverride !== undefined
        ? targetMembershipOverride
        : { id: 'mem-target', organizationId: ORG_ID, userId: TARGET_ID, role: targetRole, status: 'active', createdAt: new Date(), updatedAt: new Date() }

    const updated = updatedOverride !== undefined
      ? updatedOverride
      : {
          id: 'mem-target', organizationId: ORG_ID, userId: TARGET_ID,
          role: 'manager', status: 'active', createdAt: new Date(), updatedAt: new Date(),
          user: { id: TARGET_ID, name: 'Bob', email: 'bob@test.com' },
        }

    return makePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn()
          .mockResolvedValueOnce(mockMembership(USER_ID, 'owner')) // authenticate
          .mockResolvedValue(targetMembership),                     // patchUser lookup
        findMany: vi.fn(), count: vi.fn(),
        update: vi.fn().mockResolvedValue(updated),
      },
    })
  }

  it('200 — altera papel de agent para manager', async () => {
    app = makeApp(makePatchPrisma('agent'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${TARGET_ID}`,
      headers: { authorization: auth },
      payload: { role: 'manager' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.role).toBe('manager')
  })

  it('200 — inativa vínculo (status: inactive)', async () => {
    const updated = {
      id: 'mem-target', organizationId: ORG_ID, userId: TARGET_ID,
      role: 'agent', status: 'inactive', createdAt: new Date(), updatedAt: new Date(),
      user: { id: TARGET_ID, name: 'Bob', email: 'bob@test.com' },
    }

    app = makeApp(makePatchPrisma('agent', undefined, updated))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${TARGET_ID}`,
      headers: { authorization: auth },
      payload: { status: 'inactive' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('inactive')
  })

  it('409 — não altera vínculo do owner', async () => {
    app = makeApp(makePatchPrisma('owner'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${TARGET_ID}`,
      headers: { authorization: auth },
      payload: { role: 'admin' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('CONFLICT')
  })

  it('409 — usuário não altera o próprio vínculo (auto-alteração)', async () => {
    // Target = USER_ID (mesmo que o solicitante)
    const selfMembership = { id: 'mem-self', organizationId: ORG_ID, userId: USER_ID, role: 'admin', status: 'active', createdAt: new Date(), updatedAt: new Date() }

    const prisma = makePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn()
          .mockResolvedValueOnce(mockMembership(USER_ID, 'owner')) // authenticate
          .mockResolvedValue(selfMembership),                       // patchUser lookup
        findMany: vi.fn(), count: vi.fn(), update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    // PATCH /users/USER_ID (próprio usuário)
    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${USER_ID}`,
      headers: { authorization: auth },
      payload: { role: 'agent' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('CONFLICT')
  })

  it('404 — usuário de outra organização (cross-tenant → 404)', async () => {
    // membership lookup for target returns null (not in this org)
    app = makeApp(makePatchPrisma('agent', null))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${TARGET_ID}`,
      headers: { authorization: auth },
      payload: { role: 'manager' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('403 — viewer não tem users.manage', async () => {
    const prisma = makePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(mockMembership(USER_ID, 'viewer')),
        findMany: vi.fn(), count: vi.fn(), update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${TARGET_ID}`,
      headers: { authorization: auth },
      payload: { role: 'manager' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('400 — payload vazio (sem campos obrigatórios)', async () => {
    app = makeApp(makePatchPrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${TARGET_ID}`,
      headers: { authorization: auth },
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('400 — papel owner não é atribuível via PATCH', async () => {
    app = makeApp(makePatchPrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${TARGET_ID}`,
      headers: { authorization: auth },
      payload: { role: 'owner' },
    })

    // Zod rejeita 'owner' no enum de patchUserSchema
    expect(res.statusCode).toBe(400)
  })

  it('401 — sem token', async () => {
    app = makeApp(makePrisma())

    const res = await app.inject({ method: 'PATCH', url: `/api/v1/users/${TARGET_ID}` })
    expect(res.statusCode).toBe(401)
  })
})
