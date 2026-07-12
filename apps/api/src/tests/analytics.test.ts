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
const AGENT_1 = 'agent-1-uuid'
const AGENT_2 = 'agent-2-uuid'

const noOpRedis = {} as unknown as Redis

const mockUser = {
  id: USER_ID, name: 'Alice', email: 'alice@test.com',
  passwordHash: 'hash', status: 'active', createdAt: new Date(), updatedAt: new Date(),
}

function mockMembership(role = 'owner') {
  return { id: 'mem-uuid', organizationId: ORG_ID, userId: USER_ID, role, status: 'active', createdAt: new Date(), updatedAt: new Date() }
}

// ----------------------------------------------------------------
// Prisma mock builder
// ----------------------------------------------------------------
function makePrisma(opts: {
  role?: string
  conversations?: Array<{ id: string; status: string; assignedUserId: string | null }>
  periodMessages?: Array<{ authorType: string; authorId: string | null }>
  history?: Array<{ conversationId: string; authorType: string; createdAt: Date }>
} = {}): PrismaClient {
  const conversations = opts.conversations ?? []
  const periodMessages = opts.periodMessages ?? []
  const history = opts.history ?? []

  const prisma: Record<string, unknown> = {
    user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
    organizationMember: {
      findFirst: vi.fn().mockResolvedValue(mockMembership(opts.role ?? 'owner')),
    },
    conversation: {
      findMany: vi.fn().mockResolvedValue(conversations),
    },
    message: {
      findMany: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        if (where.conversationId) return Promise.resolve(history)
        return Promise.resolve(periodMessages)
      }),
    },
  }

  return prisma as unknown as PrismaClient
}

function makeApp(prisma: PrismaClient): FastifyInstance {
  return buildApp({ nodeEnv: 'test', jwtSecret: JWT_SECRET, prisma, redis: noOpRedis })
}

async function authHeader(app: FastifyInstance): Promise<string> {
  await app.ready()
  return `Bearer ${app.jwt.sign({ sub: USER_ID, organizationId: ORG_ID })}`
}

function overviewUrl(query = ''): string {
  return `/api/v1/analytics/overview${query}`
}

// ================================================================
// GET /api/v1/analytics/overview
// ================================================================
describe('GET /api/v1/analytics/overview', () => {
  let app: FastifyInstance

  afterEach(async () => { await app?.close() })

  it('200 — overview vazio retorna métricas zeradas', async () => {
    app = makeApp(makePrisma())
    const auth = await authHeader(app)

    const res = await app.inject({ method: 'GET', url: overviewUrl(), headers: { authorization: auth } })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toEqual({
      conversationsTotal: 0,
      openConversations: 0,
      resolvedConversations: 0,
      closedConversations: 0,
      messagesTotal: 0,
      avgFirstResponseSeconds: 0,
      byAgent: [],
    })
  })

  it('200 — overview com dados calcula totais por status e mensagens', async () => {
    const conversations = [
      { id: 'c1', status: 'open', assignedUserId: AGENT_1 },
      { id: 'c2', status: 'resolved', assignedUserId: AGENT_1 },
      { id: 'c3', status: 'closed', assignedUserId: AGENT_2 },
    ]
    const periodMessages = [
      { authorType: 'customer', authorId: null },
      { authorType: 'agent', authorId: AGENT_1 },
      { authorType: 'agent', authorId: AGENT_2 },
    ]
    app = makeApp(makePrisma({ conversations, periodMessages }))
    const auth = await authHeader(app)

    const res = await app.inject({ method: 'GET', url: overviewUrl(), headers: { authorization: auth } })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.conversationsTotal).toBe(3)
    expect(body.data.openConversations).toBe(1)
    expect(body.data.resolvedConversations).toBe(1)
    expect(body.data.closedConversations).toBe(1)
    expect(body.data.messagesTotal).toBe(3)
  })

  it('200 — filtro por período é validado e ecoado em meta', async () => {
    app = makeApp(makePrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'GET',
      url: overviewUrl('?from=2026-01-01&to=2026-01-31'),
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().meta).toEqual({ from: '2026-01-01', to: '2026-01-31' })
  })

  it('400 — from > to retorna VALIDATION_ERROR', async () => {
    app = makeApp(makePrisma())
    const auth = await authHeader(app)

    const res = await app.inject({
      method: 'GET',
      url: overviewUrl('?from=2026-02-01&to=2026-01-01'),
      headers: { authorization: auth },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('200 — filtra por organização autenticada (não recebe organizationId no payload)', async () => {
    const prisma = makePrisma()
    app = makeApp(prisma)
    const auth = await authHeader(app)

    await app.inject({ method: 'GET', url: overviewUrl(), headers: { authorization: auth } })

    const call = (prisma.conversation.findMany as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.where.organizationId).toBe(ORG_ID)
  })

  it('403 — agent não tem analytics.read', async () => {
    app = makeApp(makePrisma({ role: 'agent' }))
    const auth = await authHeader(app)

    const res = await app.inject({ method: 'GET', url: overviewUrl(), headers: { authorization: auth } })

    expect(res.statusCode).toBe(403)
  })

  it('401 — sem token', async () => {
    app = makeApp(makePrisma())

    const res = await app.inject({ method: 'GET', url: overviewUrl() })

    expect(res.statusCode).toBe(401)
  })

  it('calcula avgFirstResponseSeconds com base na primeira mensagem do cliente e a primeira resposta do atendente', async () => {
    const conversations = [{ id: 'c1', status: 'open', assignedUserId: null }]
    const t0 = new Date('2026-01-10T10:00:00.000Z')
    const history = [
      { conversationId: 'c1', authorType: 'customer', createdAt: t0 },
      { conversationId: 'c1', authorType: 'agent', createdAt: new Date(t0.getTime() + 60_000) },
    ]
    app = makeApp(makePrisma({ conversations, history }))
    const auth = await authHeader(app)

    const res = await app.inject({ method: 'GET', url: overviewUrl(), headers: { authorization: auth } })

    expect(res.json().data.avgFirstResponseSeconds).toBe(60)
  })

  it('ignora conversa iniciada pela empresa (sem mensagem de cliente) no cálculo de tempo de resposta', async () => {
    const conversations = [{ id: 'c1', status: 'open', assignedUserId: null }]
    const t0 = new Date('2026-01-10T10:00:00.000Z')
    const history = [
      { conversationId: 'c1', authorType: 'agent', createdAt: t0 },
    ]
    app = makeApp(makePrisma({ conversations, history }))
    const auth = await authHeader(app)

    const res = await app.inject({ method: 'GET', url: overviewUrl(), headers: { authorization: auth } })

    expect(res.json().data.avgFirstResponseSeconds).toBe(0)
  })

  it('agrega assignedConversations e messagesSent por atendente', async () => {
    const conversations = [
      { id: 'c1', status: 'open', assignedUserId: AGENT_1 },
      { id: 'c2', status: 'open', assignedUserId: AGENT_1 },
      { id: 'c3', status: 'open', assignedUserId: AGENT_2 },
    ]
    const periodMessages = [
      { authorType: 'agent', authorId: AGENT_1 },
      { authorType: 'agent', authorId: AGENT_1 },
      { authorType: 'agent', authorId: AGENT_2 },
      { authorType: 'customer', authorId: null },
    ]
    app = makeApp(makePrisma({ conversations, periodMessages }))
    const auth = await authHeader(app)

    const res = await app.inject({ method: 'GET', url: overviewUrl(), headers: { authorization: auth } })

    const byAgent = res.json().data.byAgent as Array<{ userId: string; assignedConversations: number; messagesSent: number }>
    const agent1 = byAgent.find((a) => a.userId === AGENT_1)
    const agent2 = byAgent.find((a) => a.userId === AGENT_2)
    expect(agent1).toEqual({ userId: AGENT_1, assignedConversations: 2, messagesSent: 2 })
    expect(agent2).toEqual({ userId: AGENT_2, assignedConversations: 1, messagesSent: 1 })
  })
})
