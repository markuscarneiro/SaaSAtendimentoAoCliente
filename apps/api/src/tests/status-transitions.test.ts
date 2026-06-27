import { describe, it, expect, vi, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { buildApp } from '../server'
import { VALID_TRANSITIONS } from '../modules/conversations/conversation.service'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const JWT_SECRET = 'test-secret-32-chars-do-not-use-in-production!!'
const ORG_ID = 'org-uuid'
const USER_ID = 'user-uuid'
const CONV_ID = 'conv-uuid'

const noOpRedis = {} as unknown as Redis

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------
const mockUser = {
  id: USER_ID, name: 'Alice', email: 'alice@test.com',
  passwordHash: 'hash', status: 'active', createdAt: new Date(), updatedAt: new Date(),
}

function mockMembership(role = 'owner') {
  return { id: 'mem-uuid', organizationId: ORG_ID, userId: USER_ID, role, status: 'active', createdAt: new Date(), updatedAt: new Date() }
}

function mockConversation(status = 'open', overrides: Record<string, unknown> = {}) {
  return {
    id: CONV_ID, organizationId: ORG_ID, customerId: 'cust-uuid',
    assignedUserId: null, status, priority: 'normal', channel: 'manual',
    subject: null, lastMessageAt: null, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  }
}

// ----------------------------------------------------------------
// Prisma mock builder
// ----------------------------------------------------------------
function makePrisma(
  convStatus = 'open',
  memberForAssign: unknown = { id: 'mem-2', organizationId: ORG_ID, userId: 'agent-uuid', status: 'active' },
  convOverrides: Record<string, unknown> = {},
): PrismaClient {
  const conv = mockConversation(convStatus, convOverrides)
  const updatedConv = { ...conv }

  const prisma: Record<string, unknown> = {
    user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
    organization: { create: vi.fn() },
    organizationMember: {
      create: vi.fn(),
      findFirst: vi.fn()
        .mockResolvedValueOnce(mockMembership())  // auth middleware
        .mockResolvedValue(memberForAssign),       // assignedUserId validation
    },
    customer: { findFirst: vi.fn(), create: vi.fn() },
    conversation: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(conv),
      create: vi.fn(),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...updatedConv, ...data }),
      ),
    },
    message: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  }

  prisma.$transaction = vi.fn(async (fn: (tx: PrismaClient) => unknown) =>
    fn(prisma as unknown as PrismaClient),
  )

  return prisma as unknown as PrismaClient
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

function patchUrl(id = CONV_ID) {
  return `/api/v1/conversations/${id}`
}

// ================================================================
// VALID_TRANSITIONS — unit test para a tabela completa §4.0.1
// ================================================================
describe('VALID_TRANSITIONS — tabela de transições de status §4.0.1', () => {
  it('open permite: waiting_agent, waiting_customer, resolved', () => {
    expect(VALID_TRANSITIONS.open).toEqual(
      expect.arrayContaining(['waiting_agent', 'waiting_customer', 'resolved']),
    )
    expect(VALID_TRANSITIONS.open).not.toContain('closed')
  })

  it('waiting_agent permite: waiting_customer, resolved', () => {
    expect(VALID_TRANSITIONS.waiting_agent).toEqual(
      expect.arrayContaining(['waiting_customer', 'resolved']),
    )
    expect(VALID_TRANSITIONS.waiting_agent).not.toContain('open')
    expect(VALID_TRANSITIONS.waiting_agent).not.toContain('closed')
  })

  it('waiting_customer permite: waiting_agent, resolved', () => {
    expect(VALID_TRANSITIONS.waiting_customer).toEqual(
      expect.arrayContaining(['waiting_agent', 'resolved']),
    )
    expect(VALID_TRANSITIONS.waiting_customer).not.toContain('closed')
  })

  it('resolved permite: closed, open (reabertura)', () => {
    expect(VALID_TRANSITIONS.resolved).toEqual(
      expect.arrayContaining(['closed', 'open']),
    )
    expect(VALID_TRANSITIONS.resolved).not.toContain('waiting_agent')
  })

  it('closed permite apenas: open (reabertura)', () => {
    expect(VALID_TRANSITIONS.closed).toEqual(['open'])
  })
})

// ================================================================
// PATCH /api/v1/conversations/:id — transições de status
// ================================================================
describe('PATCH /api/v1/conversations/:id — status', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('200 — transição válida: open → resolved', async () => {
    app = makeApp(makePrisma('open'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'resolved' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('resolved')
  })

  it('200 — PATCH para o mesmo status atual é no-op (200 sem erro)', async () => {
    app = makeApp(makePrisma('open'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'open' }, // mesmo status
    })

    expect(res.statusCode).toBe(200)
    // update ainda é chamado (no-op pelo mesmo status final)
    expect(res.json().data.id).toBe(CONV_ID)
  })

  it('409 — transição inválida: open → closed', async () => {
    app = makeApp(makePrisma('open'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'closed' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('CONFLICT')
  })

  it('409 — transição inválida: waiting_agent → closed', async () => {
    app = makeApp(makePrisma('waiting_agent'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'closed' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('CONFLICT')
  })

  it('409 — transição inválida: closed → resolved', async () => {
    app = makeApp(makePrisma('closed'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'resolved' },
    })

    expect(res.statusCode).toBe(409)
  })

  it('200 — reabre conversa resolved → open', async () => {
    app = makeApp(makePrisma('resolved'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'open' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('open')
  })

  it('200 — reabre conversa closed → open', async () => {
    app = makeApp(makePrisma('closed'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'open' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('open')
  })

  it('200 — transição waiting_customer → waiting_agent', async () => {
    app = makeApp(makePrisma('waiting_customer'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'waiting_agent' },
    })

    expect(res.statusCode).toBe(200)
  })

  it('200 — resolved → closed', async () => {
    app = makeApp(makePrisma('resolved'))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'closed' },
    })

    expect(res.statusCode).toBe(200)
  })
})

// ================================================================
// PATCH /api/v1/conversations/:id — atribuição (assignedUserId)
// ================================================================
describe('PATCH /api/v1/conversations/:id — assignedUserId', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('200 — atribui conversa a membro ativo da org', async () => {
    const agentMember = { id: 'mem-2', organizationId: ORG_ID, userId: 'agent-uuid', status: 'active', role: 'agent' }
    app = makeApp(makePrisma('open', agentMember))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { assignedUserId: 'agent-uuid' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.assignedUserId).toBe('agent-uuid')
  })

  it('404 — assignedUserId de usuário fora da org', async () => {
    app = makeApp(makePrisma('open', null)) // memberForAssign = null → not found
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { assignedUserId: 'user-outra-org' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('200 — remove atribuição com assignedUserId: null', async () => {
    app = makeApp(makePrisma('open', null, { assignedUserId: 'agent-uuid' }))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { assignedUserId: null },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.assignedUserId).toBeNull()
  })

  it('200 — atualiza status e assignedUserId em um único PATCH', async () => {
    const agentMember = { id: 'mem-2', organizationId: ORG_ID, userId: 'agent-uuid', status: 'active', role: 'agent' }
    app = makeApp(makePrisma('open', agentMember))
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'waiting_agent', assignedUserId: 'agent-uuid' },
    })

    expect(res.statusCode).toBe(200)
  })
})

// ================================================================
// Autorização e cross-tenant
// ================================================================
describe('PATCH /api/v1/conversations/:id — autorização e tenant', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('403 — viewer não tem conversations.manage', async () => {
    const prisma = makePrisma('open')
    // viewer não tem conversations.manage (authorization-spec §4)
    ;(prisma as unknown as { organizationMember: { findFirst: ReturnType<typeof vi.fn> } })
      .organizationMember.findFirst = vi.fn().mockResolvedValue(mockMembership('viewer'))

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: { status: 'resolved' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('401 — sem token', async () => {
    app = makeApp(makePrisma())

    const res = await app.inject({ method: 'PATCH', url: patchUrl(), payload: { status: 'resolved' } })
    expect(res.statusCode).toBe(401)
  })

  it('404 — conversa de outro tenant', async () => {
    const prisma = makePrisma()
    // conversation.findFirst retorna null (cross-tenant → not found)
    ;(prisma as unknown as { conversation: { findFirst: ReturnType<typeof vi.fn> } })
      .conversation.findFirst = vi.fn().mockResolvedValue(null)

    app = makeApp(prisma)
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl('conv-outra-org'),
      headers: { authorization: auth },
      payload: { status: 'resolved' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('400 — payload sem campos obrigatórios', async () => {
    app = makeApp(makePrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'PATCH', url: patchUrl(),
      headers: { authorization: auth },
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })
})
