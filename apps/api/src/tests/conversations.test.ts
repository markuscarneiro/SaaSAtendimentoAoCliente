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
const USER_ID = 'user-uuid'

// ----------------------------------------------------------------
// Shared fixtures
// ----------------------------------------------------------------
const mockUser = {
  id: USER_ID, name: 'Alice', email: 'alice@test.com',
  passwordHash: 'hash', status: 'active', createdAt: new Date(), updatedAt: new Date(),
}

const mockMembership = (role = 'owner') => ({
  id: 'mem-uuid', organizationId: ORG_ID, userId: USER_ID,
  role, status: 'active', createdAt: new Date(), updatedAt: new Date(),
})

const mockCustomer = (id = 'cust-uuid', overrides: Record<string, unknown> = {}) => ({
  id, organizationId: ORG_ID, name: 'Cliente X', email: null,
  externalRef: null, metadata: null, createdAt: new Date(),
  ...overrides,
})

const mockConversation = (id = 'conv-uuid', overrides: Record<string, unknown> = {}) => ({
  id, organizationId: ORG_ID, customerId: 'cust-uuid',
  assignedUserId: null, status: 'open', priority: 'normal', channel: 'manual',
  subject: null, lastMessageAt: null, createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
})

const noOpRedis = {} as unknown as Redis

// ----------------------------------------------------------------
// App builder helper
// ----------------------------------------------------------------
type PrismaMock = Record<string, unknown>

function makeApp(prisma: PrismaClient, role = 'owner'): FastifyInstance {
  const app = buildApp({ nodeEnv: 'test', jwtSecret: JWT_SECRET, prisma, redis: noOpRedis })
  return app
}

async function bearerToken(app: FastifyInstance, orgId = ORG_ID): Promise<string> {
  await app.ready()
  return `Bearer ${app.jwt.sign({ sub: USER_ID, organizationId: orgId })}`
}

// ----------------------------------------------------------------
// Prisma mock factories
// ----------------------------------------------------------------
function basePrisma(overrides: Partial<PrismaMock> = {}): PrismaClient {
  const base: PrismaMock = {
    user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
    organization: { create: vi.fn() },
    organizationMember: {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(mockMembership()),
    },
    $transaction: vi.fn(),
    customer: { findFirst: vi.fn(), create: vi.fn() },
    conversation: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    message: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  }
  return { ...base, ...overrides } as unknown as PrismaClient
}

function withTransaction(prisma: PrismaClient): PrismaClient {
  const p = prisma as unknown as PrismaMock
  ;(p as { $transaction: ReturnType<typeof vi.fn> }).$transaction = vi.fn(
    async (fn: (tx: PrismaClient) => unknown) => fn(prisma),
  )
  return prisma
}

// ================================================================
// POST /api/v1/conversations
// ================================================================
describe('POST /api/v1/conversations', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('201 — cria conversa e customer novo (sem email)', async () => {
    const customer = mockCustomer()
    const conv = mockConversation()

    const prisma = withTransaction(basePrisma({
      customer: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(customer),
      },
      conversation: {
        ...basePrisma().conversation as object,
        create: vi.fn().mockResolvedValue(conv),
      },
    }))

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations',
      headers: { authorization: auth },
      payload: { customer: { name: 'Cliente X' } },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.id).toBe('conv-uuid')
    expect(body.data.status).toBe('open')
    expect(body.data.customer.id).toBe('cust-uuid')

    // customer.create chamado com name e sem email
    const { create } = (prisma as unknown as { customer: { create: ReturnType<typeof vi.fn> } }).customer
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Cliente X' }) }),
    )
  })

  it('201 — reutiliza customer existente quando email coincide na mesma org', async () => {
    const existingCustomer = mockCustomer('existing-cust', { name: 'Nome Antigo', email: 'cli@x.com' })
    const conv = mockConversation('conv-2', { customerId: 'existing-cust' })

    const customerFindFirst = vi.fn().mockResolvedValue(existingCustomer)
    const customerCreate = vi.fn()

    const prisma = withTransaction(basePrisma({
      customer: {
        findFirst: customerFindFirst,
        create: customerCreate,
      },
      conversation: {
        ...basePrisma().conversation as object,
        create: vi.fn().mockResolvedValue(conv),
      },
    }))

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations',
      headers: { authorization: auth },
      payload: { customer: { name: 'Nome Novo', email: 'cli@x.com' } },
    })

    expect(res.statusCode).toBe(201)

    // customer.findFirst chamado com email normalizado
    expect(customerFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ email: 'cli@x.com', organizationId: ORG_ID }) }),
    )
    // customer.create NÃO foi chamado (reutilizou)
    expect(customerCreate).not.toHaveBeenCalled()

    // nome do customer existente NÃO foi sobrescrito (conv aponta para existing-cust)
    const { create: convCreate } = (prisma as unknown as { conversation: { create: ReturnType<typeof vi.fn> } }).conversation
    expect(convCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ customerId: 'existing-cust' }) }),
    )
  })

  it('201 — cria novo customer quando email é omitido (sem deduplicação)', async () => {
    const customer = mockCustomer()
    const conv = mockConversation()

    const customerCreate = vi.fn().mockResolvedValue(customer)

    const prisma = withTransaction(basePrisma({
      customer: {
        findFirst: vi.fn(),
        create: customerCreate,
      },
      conversation: {
        ...basePrisma().conversation as object,
        create: vi.fn().mockResolvedValue(conv),
      },
    }))

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    await app.inject({
      method: 'POST', url: '/api/v1/conversations',
      headers: { authorization: auth },
      payload: { customer: { name: 'Sem Email' } },
    })

    // findFirst nunca chamado pois não há email para buscar
    const { findFirst } = (prisma as unknown as { customer: { findFirst: ReturnType<typeof vi.fn> } }).customer
    expect(findFirst).not.toHaveBeenCalled()
    expect(customerCreate).toHaveBeenCalled()
  })

  it('normaliza email do customer para lowercase antes da resolução', async () => {
    const customerCreate = vi.fn().mockResolvedValue(mockCustomer())
    const prisma = withTransaction(basePrisma({
      customer: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: customerCreate,
      },
      conversation: {
        ...basePrisma().conversation as object,
        create: vi.fn().mockResolvedValue(mockConversation()),
      },
    }))

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    await app.inject({
      method: 'POST', url: '/api/v1/conversations',
      headers: { authorization: auth },
      payload: { customer: { name: 'Teste', email: '  CLIENTE@XPTO.COM  ' } },
    })

    expect(customerCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: 'cliente@xpto.com' }) }),
    )
  })

  it('400 — rejeita payload sem customer.name', async () => {
    app = makeApp(basePrisma())
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations',
      headers: { authorization: auth },
      payload: { customer: {} },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('403 — viewer não tem conversations.create', async () => {
    const prisma = basePrisma({
      organizationMember: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(mockMembership('viewer')),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations',
      headers: { authorization: auth },
      payload: { customer: { name: 'X' } },
    })

    expect(res.statusCode).toBe(403)
  })

  it('401 — sem token', async () => {
    app = makeApp(basePrisma())

    const res = await app.inject({ method: 'POST', url: '/api/v1/conversations' })
    expect(res.statusCode).toBe(401)
  })
})

// ================================================================
// GET /api/v1/conversations
// ================================================================
describe('GET /api/v1/conversations', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('200 — lista conversas da organização autenticada', async () => {
    const conv = { ...mockConversation(), customer: { id: 'cust-uuid', name: 'X', email: null } }

    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn().mockResolvedValue([conv]),
        count: vi.fn().mockResolvedValue(1),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta.total).toBe(1)
    expect(body.meta.page).toBe(1)

    // query sempre filtrada pela org autenticada
    const { findMany } = (prisma as unknown as { conversation: { findMany: ReturnType<typeof vi.fn> } }).conversation
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: ORG_ID }) }),
    )
  })

  it('200 — página além do total retorna lista vazia com meta correto', async () => {
    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(5),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations?page=99&pageSize=20',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(0)
    expect(res.json().meta.total).toBe(5)
  })

  it('400 — sort inválido retorna 400', async () => {
    app = makeApp(basePrisma())
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations?sort=invalidField',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(400)
  })
})

// ================================================================
// GET /api/v1/conversations/:id
// ================================================================
describe('GET /api/v1/conversations/:id', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('200 — retorna conversa com customer e mensagens recentes', async () => {
    const conv = { ...mockConversation(), customer: { id: 'cust-uuid', name: 'X', email: null } }
    const msgs = [
      { id: 'msg-1', conversationId: 'conv-uuid', organizationId: ORG_ID,
        authorType: 'agent', authorId: USER_ID, content: 'Olá', metadata: null, createdAt: new Date() },
    ]

    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(conv),
        create: vi.fn(),
        update: vi.fn(),
      },
      message: {
        findMany: vi.fn().mockResolvedValue(msgs),
        count: vi.fn(),
        create: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations/conv-uuid',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.id).toBe('conv-uuid')
    expect(body.data.customer.id).toBe('cust-uuid')
    expect(body.data.messages).toHaveLength(1)
  })

  it('404 — conversa de outro tenant retorna 404 (sem vazar dados)', async () => {
    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null), // não encontrada na org autenticada
        create: vi.fn(),
        update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations/conv-outra-org',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(404)
    // query sempre filtra pela org — outra org → não encontra → 404 (sem info sobre existência)
    const { findFirst } = (prisma as unknown as { conversation: { findFirst: ReturnType<typeof vi.fn> } }).conversation
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: ORG_ID, id: 'conv-outra-org' }) }),
    )
  })

  it('200 — conversa sem mensagens retorna messages: []', async () => {
    const conv = { ...mockConversation(), customer: { id: 'cust-uuid', name: 'X', email: null } }

    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(conv),
        create: vi.fn(),
        update: vi.fn(),
      },
      message: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn(),
        create: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations/conv-uuid',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.messages).toEqual([])
  })
})

// ================================================================
// POST /api/v1/conversations/:id/messages
// ================================================================
describe('POST /api/v1/conversations/:id/messages', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  const mockMessage = (overrides: Record<string, unknown> = {}) => ({
    id: 'msg-uuid', conversationId: 'conv-uuid', organizationId: ORG_ID,
    authorType: 'agent', authorId: USER_ID, content: 'Olá', metadata: null, createdAt: new Date(),
    ...overrides,
  })

  function makeMessagePrisma(convOverrides: Record<string, unknown> = {}) {
    const conv = mockConversation('conv-uuid', convOverrides)
    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(conv),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue(conv),
      },
      message: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn().mockResolvedValue(mockMessage()),
      },
    })
    return withTransaction(prisma)
  }

  it('201 — cria mensagem de agent e atualiza lastMessageAt', async () => {
    const prisma = makeMessagePrisma()
    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations/conv-uuid/messages',
      headers: { authorization: auth },
      payload: { authorType: 'agent', content: 'Olá' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.authorType).toBe('agent')
    // authorId deve ser o userId do authUser (não pode vir do payload)
    expect(body.data.authorId).toBe(USER_ID)

    // update de lastMessageAt chamado
    const { update } = (prisma as unknown as { conversation: { update: ReturnType<typeof vi.fn> } }).conversation
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastMessageAt: expect.anything() }) }),
    )
  })

  it('201 — cria mensagem de customer; authorId = customerId da conversa', async () => {
    const prisma = makeMessagePrisma()
    const p = prisma as unknown as { message: { create: ReturnType<typeof vi.fn> } }
    p.message.create.mockResolvedValue(mockMessage({ authorType: 'customer', authorId: 'cust-uuid' }))

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations/conv-uuid/messages',
      headers: { authorization: auth },
      payload: { authorType: 'customer', content: 'Preciso de ajuda' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.authorType).toBe('customer')

    // authorId derivado do customerId da conversa
    const { create } = p.message
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: 'cust-uuid', authorType: 'customer' }),
      }),
    )
  })

  it('400 — authorType: system é reservado ao backend', async () => {
    app = makeApp(makeMessagePrisma())
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations/conv-uuid/messages',
      headers: { authorization: auth },
      payload: { authorType: 'system', content: 'auto' },
    })

    // Zod rejeita 'system' no enum → 400
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('201 — campo authorId no payload é ignorado; authorId derivado do contexto (spec §4.0.2)', async () => {
    // authorId extra no body deve ser ignorado pelo Zod (campo não está no schema)
    const prisma = makeMessagePrisma()
    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations/conv-uuid/messages',
      headers: { authorization: auth },
      payload: { authorType: 'agent', content: 'Olá', authorId: 'hacker-id' },
    })

    // request deve ser aceito (Zod ignora campo extra por padrão)
    expect(res.statusCode).toBe(201)

    // authorId no message.create NÃO é 'hacker-id', é o userId do authUser
    const { create } = (prisma as unknown as { message: { create: ReturnType<typeof vi.fn> } }).message
    expect(create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ authorId: 'hacker-id' }) }),
    )
  })

  it('409 — conversa fechada rejeita nova mensagem', async () => {
    const prisma = makeMessagePrisma({ status: 'closed' })
    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations/conv-uuid/messages',
      headers: { authorization: auth },
      payload: { authorType: 'agent', content: 'Tentativa' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('CONFLICT')
  })

  it('404 — conversa de outro tenant retorna 404', async () => {
    const prisma = withTransaction(basePrisma({
      conversation: {
        findMany: vi.fn(), count: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null), // org filter → não encontrada
        create: vi.fn(), update: vi.fn(),
      },
    }))

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations/conv-outra-org/messages',
      headers: { authorization: auth },
      payload: { authorType: 'agent', content: 'X' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('403 — viewer não tem messages.create', async () => {
    const prisma = makeMessagePrisma()
    ;(prisma as unknown as { organizationMember: { findFirst: ReturnType<typeof vi.fn> } }).organizationMember.findFirst
      = vi.fn().mockResolvedValue(mockMembership('viewer'))

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'POST', url: '/api/v1/conversations/conv-uuid/messages',
      headers: { authorization: auth },
      payload: { authorType: 'agent', content: 'X' },
    })

    expect(res.statusCode).toBe(403)
  })
})

// ================================================================
// GET /api/v1/conversations/:id/messages (paginado)
// ================================================================
describe('GET /api/v1/conversations/:id/messages', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('200 — retorna mensagens paginadas em ordem crescente (createdAt asc)', async () => {
    const msgs = [
      { id: 'msg-1', createdAt: new Date('2026-01-01'), organizationId: ORG_ID,
        conversationId: 'conv-uuid', authorType: 'agent', authorId: USER_ID, content: 'A', metadata: null },
      { id: 'msg-2', createdAt: new Date('2026-01-02'), organizationId: ORG_ID,
        conversationId: 'conv-uuid', authorType: 'customer', authorId: 'cust-uuid', content: 'B', metadata: null },
    ]

    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn(), count: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(mockConversation()),
        create: vi.fn(), update: vi.fn(),
      },
      message: {
        findMany: vi.fn().mockResolvedValue(msgs),
        count: vi.fn().mockResolvedValue(2),
        create: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations/conv-uuid/messages?page=1&pageSize=20',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta).toMatchObject({ page: 1, pageSize: 20, total: 2 })

    // verifica ordem asc
    const { findMany } = (prisma as unknown as { message: { findMany: ReturnType<typeof vi.fn> } }).message
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
    )
  })

  it('404 — conversa de outro tenant retorna 404', async () => {
    const prisma = basePrisma({
      conversation: {
        findMany: vi.fn(), count: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null), // não encontrada
        create: vi.fn(), update: vi.fn(),
      },
    })

    app = makeApp(prisma)
    const auth = await bearerToken(app)

    const res = await app.inject({
      method: 'GET', url: '/api/v1/conversations/outra-org/messages',
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(404)
  })
})
